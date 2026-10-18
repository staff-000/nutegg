// Private API executors stay in this profile. Obsidian only receives public metadata.
const NutEggExecution = (() => {
  let socket,
    opening,
    session,
    state,
    heartbeat,
    retry,
    failures = 0;
  const jobs = new Map();
  const calls = new Map();
  const send = message => {
    if (socket?.readyState === 1) socket.send(JSON.stringify(message));
  };

  async function identity() {
    const saved = await chrome.storage.local.get(['executionClientId']);
    if (saved.executionClientId) return saved.executionClientId;
    const id = crypto.randomUUID();
    await chrome.storage.local.set({ executionClientId: id });
    return id;
  }

  function cancel(jobId, finished = false) {
    const job = jobs.get(jobId);
    if (!job) return;
    clearTimeout(job.timer);
    job.controller.abort();
    if (!finished) job.transport?.abort();
    jobs.delete(jobId);
    for (const [id, call] of calls) {
      if (call.jobId === jobId) calls.delete(id);
    }
  }

  function close() {
    if (typeof cancelObsidianRequests === 'function') cancelObsidianRequests();
    clearInterval(heartbeat);
    clearTimeout(retry);
    heartbeat = null;
    retry = null;
    for (const id of jobs.keys()) cancel(id);
    const previous = socket;
    socket = null;
    session = null;
    previous?.close();
  }

  async function cache(next) {
    if (state?.instanceId === next.instanceId && next.revision < state.revision) return;
    if (state && (next.instanceId !== state.instanceId || next.revision !== state.revision)) {
      if (typeof cancelObsidianRequests === 'function') cancelObsidianRequests();
      for (const id of jobs.keys()) cancel(id);
    }
    state = NutEggAI.reduceSharedExecutionState(state, next);
    await chrome.storage.local.set({ obsidianExecutionState: state });
  }

  async function reconnect() {
    if ((await getConnectionMode()) !== 'obsidian') return;
    clearTimeout(retry);
    const backoffMs = Math.min(30000, 1000 * 2 ** Math.min(failures++, 5));
    retry = setTimeout(() => {
      void ensure().catch(() => reconnect());
    }, backoffMs);
  }

  async function ensure() {
    if ((await getConnectionMode()) !== 'obsidian') throw new Error('Obsidian mode is not enabled.');
    if (session && socket?.readyState === 1) return { session, state };
    if (opening) return opening;
    opening = (async () => {
      const url = await getServerUrl();
      const connection = await connectObsidian();
      if (!connection.instanceId) throw new Error('Update the NutEgg Obsidian plugin.');
      const clientId = await identity();
      const settings = await loadChromeAiSettings();
      const stored = await chrome.storage.local.get(['executionDisplayName', 'chromeApiRevision']);
      return new Promise((resolve, reject) => {
        let settled = false;
        const ws = new WebSocket(`${url.replace('http:', 'ws:')}/execution/socket`);
        socket = ws;
        const timer = setTimeout(() => {
          ws.close();
          reject(new Error('AI connection timed out.'));
        }, 8000);
        const authPayload = {
          type: 'authenticate',
          protocolVersion: NutEggAI.EXECUTION_PROTOCOL,
          clientId,
          displayName: stored.executionDisplayName || `Chrome ${clientId.slice(0, 6)}`,
          credential: connection.credential,
          instanceId: connection.instanceId,
          configuration: NutEggAI.publicExecutionSettings(settings),
          configurationRevision: stored.chromeApiRevision || 'initial',
        };
        ws.onopen = () => ws.send(JSON.stringify(authPayload));
        ws.onmessage = async event => {
          if (socket !== ws) return;
          let message;
          try {
            message = JSON.parse(event.data);
          } catch {
            ws.close();
            return;
          }
          if (message.type === 'connected') {
            if (message.state?.protocolVersion !== NutEggAI.EXECUTION_PROTOCOL) {
              clearTimeout(timer);
              settled = true;
              ws.close();
              reject(new Error('Update both NutEgg Chrome and Obsidian to use this AI connection.'));
              return;
            }
            session = message.session;
            await cache(message.state);
            clearTimeout(timer);
            settled = true;
            failures = 0;
            clearInterval(heartbeat);
            heartbeat = setInterval(() => send({ type: 'heartbeat' }), 20000);
            resolve({ session, state });
          } else if (message.type === 'state') {
            await cache(message.state);
          } else if (message.type === 'heartbeat') {
            // Acknowledge our timed heartbeat without creating a ping loop.
          } else if (message.type === 'cancel-job' || message.type === 'job-finished') {
            cancel(message.jobId, message.type === 'job-finished');
          } else if (message.type === 'ai-call') {
            void execute(message);
          } else if (message.type === 'server-stopped' || message.type === 'superseded') {
            ws.close();
          }
        };
        ws.onerror = () => {};
        ws.onclose = () => {
          clearTimeout(timer);
          if (socket !== ws) return;
          if (typeof cancelObsidianRequests === 'function') cancelObsidianRequests();
          clearInterval(heartbeat);
          socket = null;
          session = null;
          for (const id of jobs.keys()) cancel(id);
          if (!settled) reject(new Error('AI session disconnected. Reconnect before retrying.'));
          void reconnect();
        };
      });
    })().finally(() => (opening = null));
    return opening;
  }

  async function execute(message) {
    const job = jobs.get(message.jobId);
    if (
      !job ||
      job.mode !== 'apiKey' ||
      job.controller.signal.aborted ||
      job.sessionId !== session?.sessionId ||
      job.revision !== state?.revision
    ) {
      return;
    }
    const maxTokensLimit = Math.max(16384, Number(job.settings.contentAnalysisMaxTokens) || 16384);
    if (
      typeof message.request?.prompt !== 'string' ||
      message.request.prompt.length > 25 * 1024 * 1024 ||
      !Number.isSafeInteger(message.request.maxTokens) ||
      message.request.maxTokens < 1 ||
      message.request.maxTokens > maxTokensLimit
    ) {
      send({
        type: 'ai-result',
        jobId: message.jobId,
        callId: message.callId,
        error: { code: 'server_error', message: 'Invalid delegated AI request.' },
      });
      return;
    }
    const existing = calls.get(message.callId);
    if (existing) {
      if (existing.jobId === message.jobId) send(await existing.result);
      return;
    }
    const result = (async () => {
      try {
        const text = await NutEggAI.chatAI(
          message.request.prompt,
          message.request.maxTokens,
          NutEggAI.resolveConfig(job.settings),
          message.request.debugScope,
          job.controller.signal
        );
        return { type: 'ai-result', jobId: message.jobId, callId: message.callId, text };
      } catch (error) {
        return {
          type: 'ai-result',
          jobId: message.jobId,
          callId: message.callId,
          error: {
            code: error.code || 'server_error',
            message: error.message || 'AI call failed.',
          },
        };
      }
    })();
    calls.set(message.callId, { jobId: message.jobId, result });
    const response = await result;
    if (jobs.get(message.jobId) === job && !job.controller.signal.aborted) send(response);
  }

  async function register(settings) {
    const current = await ensure();
    if (current.state.transition !== 'ready') throw new Error('AI mode is changing. Retry shortly.');
    const saved = await chrome.storage.local.get(['chromeApiRevision']);
    if (settings.chromeApiRevision && settings.chromeApiRevision !== saved.chromeApiRevision)
      throw new Error('AI settings changed. Retry with the saved configuration.');
    const jobId = crypto.randomUUID();
    const controller = new AbortController();
    const captured = structuredClone(settings);
    const job = {
      settings: captured,
      controller,
      sessionId: current.session.sessionId,
      revision: current.state.revision,
      mode: current.state.mode,
      configurationRevision: saved.chromeApiRevision || 'initial',
    };
    jobs.set(jobId, job);
    job.timer = setTimeout(
      () => {
        send({ type: 'cancel-job', jobId });
        cancel(jobId);
      },
      10 * 60 * 1000
    );
    return {
      jobId,
      clientId: current.session.clientId,
      sessionId: current.session.sessionId,
      instanceId: current.state.instanceId,
      revision: current.state.revision,
      configurationRevision: saved.chromeApiRevision || 'initial',
      settings: NutEggAI.publicExecutionSettings(captured),
    };
  }

  async function changeMode(mode) {
    const current = await ensure();
    const serverUrl = await getServerUrl();
    const response = await serverFetch(`${serverUrl}/execution/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        clientId: current.session.clientId,
        sessionId: current.session.sessionId,
        instanceId: current.state.instanceId,
        expectedRevision: current.state.revision,
        operationId: crypto.randomUUID(),
      }),
    });
    const data = await response.json();
    if (data.state) await cache(data.state);
    if (!response.ok) throw new Error(data.error || 'AI mode change failed.');
    return data;
  }

  function configurationChanged(revision) {
    for (const [id, job] of jobs) {
      if (!revision || job.configurationRevision !== revision) cancel(id);
    }
    void (async () => {
      const mode = await getConnectionMode().catch(() => null);
      if (mode !== 'obsidian') return;
      const settings = await loadChromeAiSettings();
      const saved = await chrome.storage.local.get(['chromeApiRevision']);
      if (revision && saved.chromeApiRevision !== revision) return;
      if (!socket || socket.readyState !== 1) {
        await ensure().catch(() => {});
        if (socket?.readyState === 1) {
          send({
            type: 'configuration-changed',
            configurationRevision: saved.chromeApiRevision || 'initial',
            configuration: NutEggAI.publicExecutionSettings(settings),
          });
        }
        return;
      }
      send({
        type: 'configuration-changed',
        configurationRevision: saved.chromeApiRevision || 'initial',
        configuration: NutEggAI.publicExecutionSettings(settings),
      });
    })().catch(() => {});
  }

  async function latest() {
    await ensure();
    return state;
  }

  return {
    ensure,
    register,
    bindTransport(jobId, controller) {
      if (!controller) return;
      const job = jobs.get(jobId);
      if (job) job.transport = controller;
      else controller.abort();
    },
    cancel,
    changeMode,
    configurationChanged,
    close,
    latest,
    identity,
    get state() {
      return state;
    },
    get session() {
      return session;
    },
  };
})();
