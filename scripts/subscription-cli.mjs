import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';

export class BridgeError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const PROVIDERS = {
  codex: { label: 'Codex CLI', login: 'codex login', override: 'NUTEGG_CODEX_COMMAND' },
  claude: { label: 'Claude Code', login: 'claude auth login', override: 'NUTEGG_CLAUDE_COMMAND' },
};

export async function resolveSubscriptionCommand(provider, command) {
  const info = PROVIDERS[provider];
  if (!info) throw new BridgeError(400, 'Unknown subscription provider.');
  const name = command || process.env[info.override] || (process.platform === 'win32' ? `${provider}.exe` : provider);
  const candidates = isAbsolute(name) || name.includes('/') || name.includes('\\')
    ? [resolve(name)]
    : (process.env.PATH || '').split(delimiter).filter(Boolean).map(dir => join(dir, name));
  if (!command && !process.env[info.override]) candidates.push(join(homedir(), '.local', 'bin', name));
  for (const path of candidates) {
    try { await access(path, constants.X_OK); return path; } catch {}
  }
  throw new BridgeError(503, `${info.label} was not found. Install it, run ${info.login}, and restart the bridge. Set ${info.override} if it is installed outside PATH.`);
}

export function subscriptionEnvironment(provider, source = process.env) {
  const env = { ...source, NO_COLOR: '1' };
  const keys = provider === 'codex'
    ? ['OPENAI_API_KEY', 'CODEX_API_KEY', 'CODEX_ACCESS_TOKEN', 'OPENAI_BASE_URL']
    : ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_PROFILE',
      'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY', 'CLAUDE_CODE_SIMPLE'];
  for (const key of keys) delete env[key];
  return env;
}

export function subscriptionFailure(provider, detail) {
  const info = PROVIDERS[provider];
  if (/quota|rate.limit|429|usage.limit|limit reached/i.test(detail)) {
    return new BridgeError(429, `${info.label} usage limit reached. Check your subscription and retry later.`);
  }
  if (/auth|sign.in|login|credential|401|403|api.key/i.test(detail)) {
    return new BridgeError(401, `Run ${info.login} and sign in with your subscription account, then retry.`);
  }
  if (/unknown (option|argument)|unexpected argument|unrecognized (option|argument)/i.test(detail)) {
    return new BridgeError(503, `Update ${info.label}: the installed version does not support the bridge's required options.`);
  }
  if (/model.*(not found|not supported|invalid|unavailable)|invalid.*model/i.test(detail)) {
    return new BridgeError(400, `The selected model is not available in ${info.label}. Select auto or a model supported by your account.`);
  }
  return new BridgeError(502, `${info.label} failed. Verify it works in your terminal and check your subscription access.`);
}

// Prompts remain on stdin; no shell or remote command string is ever executed.
export function executeSubscriptionCli(provider, executable, args, input, { cwd, signal, timeoutMs = 180000, includeStderr = false } = {}) {
  return new Promise((resolveOutput, reject) => {
    if (signal?.aborted) return reject(new BridgeError(499, 'Request cancelled.'));
    const child = spawn(executable, args, { cwd, env: subscriptionEnvironment(provider), shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', errors = '', size = 0, failure;
    const stop = error => { failure ??= error; child.kill('SIGKILL'); };
    const cancel = () => stop(new BridgeError(499, 'Request cancelled.'));
    const timer = setTimeout(() => stop(new BridgeError(504, `${PROVIDERS[provider].label} timed out. Check your sign-in and retry.`)), timeoutMs);
    signal?.addEventListener('abort', cancel, { once: true });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      size += Buffer.byteLength(chunk);
      if (size > 4 * 1024 * 1024) stop(new BridgeError(502, 'CLI response exceeded the size limit.'));
      else output += chunk;
    });
    child.stderr.on('data', chunk => { errors = (errors + chunk).slice(-8192); });
    child.stdin.on('error', () => {});
    child.on('error', () => { failure = new BridgeError(503, `Cannot start ${PROVIDERS[provider].label}. Check its executable path and permissions.`); });
    child.on('close', code => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      if (failure) reject(failure);
      else if (code !== 0) reject(subscriptionFailure(provider, errors + output));
      else resolveOutput(includeStderr ? output + errors : output);
    });
    child.stdin.end(input);
  });
}

export function subscriptionArgs(provider, model = 'auto') {
  let args;
  if (provider === 'codex') {
    args = ['exec', '--json', '--ephemeral', '--ignore-user-config', '--ignore-rules',
      '--skip-git-repo-check', '--sandbox', 'read-only', '--color', 'never'];
    for (const setting of ['forced_login_method="chatgpt"', 'model_provider="openai"', 'approval_policy="never"',
      'web_search="disabled"', 'project_doc_max_bytes=0', 'mcp_servers={}',
      'features.shell_tool=false', 'features.unified_exec=false', 'features.shell_snapshot=false',
      'features.apps=false', 'features.plugins=false', 'features.multi_agent=false',
      'features.browser_use=false', 'features.computer_use=false', 'features.view_image=false',
      'features.hooks=false', 'features.memories=false', 'features.skip_host_skill_discovery=true']) args.push('-c', setting);
    if (model !== 'auto') args.push('--model', model);
    args.push('-');
  } else {
    args = ['--print', '--output-format', 'json', '--safe-mode', '--tools', '', '--no-chrome',
      '--disable-slash-commands', '--no-session-persistence', '--permission-mode', 'dontAsk',
      '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--settings', '{"forceLoginMethod":"claudeai"}'];
    if (model !== 'auto') args.push('--model', model);
  }
  return args;
}

export function parseSubscriptionOutput(provider, output) {
  let data;
  try {
    data = provider === 'codex' ? output.trim().split(/\r?\n/).map(line => JSON.parse(line)) : JSON.parse(output);
  } catch { throw new BridgeError(502, `${PROVIDERS[provider].label} returned invalid JSON. Update the CLI and retry.`); }
  if (provider === 'codex') {
    const failure = data.find(event => event.type === 'turn.failed' || event.type === 'error');
    if (failure) throw subscriptionFailure(provider, JSON.stringify(failure));
    if (!data.some(event => event.type === 'turn.completed')) throw new BridgeError(502, 'Codex ended before completing its response.');
    const answer = data.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').at(-1)?.item?.text;
    if (typeof answer === 'string' && answer.trim()) return answer;
  } else {
    if (data.is_error || data.subtype !== 'success') throw subscriptionFailure(provider, JSON.stringify(data));
    if (typeof data.result === 'string' && data.result.trim()) return data.result;
  }
  throw new BridgeError(502, `${PROVIDERS[provider].label} returned an empty response.`);
}

export async function checkSubscriptionCli(provider, command) {
  const executable = await resolveSubscriptionCommand(provider, command);
  const args = provider === 'codex' ? ['login', 'status'] : ['auth', 'status', '--json'];
  if (provider === 'codex') {
    const output = await executeSubscriptionCli(provider, executable, args, '', { timeoutMs: 10000, includeStderr: true });
    if (!/logged in using chatgpt/i.test(output)) {
      throw new BridgeError(401, 'Run codex login and sign in with ChatGPT. API-key logins cannot use this subscription provider.');
    }
  } else {
    const output = await executeSubscriptionCli(provider, executable, args, '', { timeoutMs: 10000 });
    let status;
    try { status = JSON.parse(output); } catch { throw new BridgeError(503, 'Update Claude Code to enable subscription status checks.'); }
    if (!status.loggedIn || !['claude.ai', 'oauth_token'].includes(status.authMethod)) {
      throw new BridgeError(401, 'Run claude auth login and sign in with your Claude subscription account.');
    }
  }
  return executable;
}

export async function runSubscription(provider, prompt, model, options = {}) {
  const executable = await checkSubscriptionCli(provider, options.command);
  const cwd = await mkdtemp(join(tmpdir(), `nutegg-${provider}-`));
  try {
    const output = await executeSubscriptionCli(provider, executable, subscriptionArgs(provider, model),
      'Complete this text analysis task using only the supplied content. Return only the requested output. Do not call tools.\n\n' + prompt,
      { ...options, cwd });
    return parseSubscriptionOutput(provider, output);
  } finally { await rm(cwd, { recursive: true, force: true }); }
}
