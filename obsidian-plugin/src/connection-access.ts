import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

type Challenge = { origin: string; expires: number; token?: string; state: 'pending' | 'approved' | 'denied' };
// Published NutEgg identity; matches website/src/versions.json. Development
// identities become trusted only after an explicit first approval in this vault.
export const NUTEGG_CHROME_ORIGIN = 'chrome-extension://bmdmdiicembobejibggoeiahaonphcol';
export class ConnectionAccess {
  private challenges = new Map<string, Challenge>();
  private activity = new Map<string, { seen: number; method?: 'apiKey' | 'subscription' }>();
  constructor(private clients: Record<string, string | string[]>, private approve: (origin: string) => Promise<boolean>, private save: () => Promise<void>) {}
  static validOrigin(origin?: string): origin is string { return !!origin && /^chrome-extension:\/\/[a-p]{32}$/.test(origin); }

  private getTokens(origin: string): string[] {
    const val = this.clients[origin];
    if (Array.isArray(val)) return val.filter(t => typeof t === 'string' && t.length > 0);
    if (typeof val === 'string' && val.length > 0) return [val];
    return [];
  }

  authorized(origin: string | undefined, authorization: string | undefined): boolean {
    if (!ConnectionAccess.validOrigin(origin)) return false;
    const tokens = this.getTokens(origin);
    if (!tokens.length || !authorization) return false;
    const actual = Buffer.from(authorization);
    for (const token of tokens) {
      const expected = Buffer.from(`Bearer ${token}`);
      if (actual.length === expected.length && timingSafeEqual(actual, expected)) {
        const id = createHash('sha256').update(origin + token).digest('hex');
        this.activity.set(id, { ...this.activity.get(id), seen: Date.now() });
        return true;
      }
    }
    return false;
  }

  recordConfiguration(origin: string | undefined, authorization: string | undefined, method: string): void {
    if (!['apiKey', 'subscription'].includes(method) || !this.authorized(origin, authorization)) return;
    const id = createHash('sha256').update(origin! + authorization!.slice(7)).digest('hex');
    this.activity.set(id, { seen: Date.now(), method: method as 'apiKey' | 'subscription' });
  }

  getStatus() {
    const now = Date.now();
    // Approval is persistent; activity is only a recent authenticated request.
    for (const [id, client] of this.activity) if (now - client.seen >= 90000) this.activity.delete(id);
    const methods = new Set([...this.activity.values()].map(client => client.method).filter(Boolean));
    return {
      recentClients: this.activity.size,
      pendingApprovals: [...this.challenges.values()].filter(challenge => challenge.state === 'pending' && challenge.expires > now).length,
      conflictingMethods: methods.size > 1,
    };
  }

  start(origin: string, nonce: string, browserOrigin?: string) {
    if (!ConnectionAccess.validOrigin(origin) || !/^[a-f0-9]{64}$/.test(nonce)) throw new Error('Invalid connection challenge');
    for (const [id, challenge] of this.challenges) if (challenge.expires < Date.now()) this.challenges.delete(id);
    const current = this.challenges.get(nonce);
    if (current) {
      if (current.origin !== origin) throw new Error('Origin mismatch');
      return { state: current.state };
    }
    if ([...this.challenges.values()].some(c => c.origin === origin && c.state === 'pending')) throw new Error('Connection approval already pending');
    if (this.challenges.size >= 16) throw new Error('Too many connection requests');
    const challenge: Challenge = { origin, expires: Date.now() + 120000, state: 'pending' };
    this.challenges.set(nonce, challenge);
    // The caller-supplied identity header is never enough to skip approval.
    // Retain browser Origin checks plus a credential on every sensitive request.
    const trusted = browserOrigin === origin && (origin === NUTEGG_CHROME_ORIGIN || this.getTokens(origin).length > 0);
    void (trusted ? Promise.resolve(true) : this.approve(origin)).then(async approved => {
      if (challenge.expires < Date.now()) return;
      if (!approved) { challenge.state = 'denied'; return; }
      const token = randomBytes(32).toString('hex');
      const previous = this.clients[origin];
      const tokens = this.getTokens(origin);
      this.clients[origin] = [token, ...tokens.filter(t => t !== token)].slice(0, 10);
      try { await this.save(); challenge.token = token; challenge.state = 'approved'; }
      catch {
        if (previous !== undefined) this.clients[origin] = previous;
        else delete this.clients[origin];
        challenge.state = 'denied';
      }
    }).catch(() => { challenge.state = 'denied'; });
    return { state: 'pending' };
  }
  finish(origin: string, nonce: string) {
    const challenge = this.challenges.get(nonce);
    if (!challenge || challenge.origin !== origin || challenge.expires < Date.now()) throw new Error('Connection challenge expired');
    if (challenge.state !== 'pending') this.challenges.delete(nonce);
    return { state: challenge.state, ...(challenge.state === 'approved' ? { credential: challenge.token } : {}) };
  }
}
