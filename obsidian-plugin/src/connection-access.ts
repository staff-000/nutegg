import { randomBytes, timingSafeEqual } from 'node:crypto';

type Challenge = { origin: string; expires: number; token?: string; state: 'pending' | 'approved' | 'denied' };
export class ConnectionAccess {
  private challenges = new Map<string, Challenge>();
  constructor(private clients: Record<string, string>, private approve: (origin: string) => Promise<boolean>, private save: () => Promise<void>) {}
  static validOrigin(origin?: string): origin is string { return !!origin && /^chrome-extension:\/\/[a-p]{32}$/.test(origin); }
  authorized(origin: string | undefined, authorization: string | undefined): boolean {
    if (!ConnectionAccess.validOrigin(origin)) return false;
    const token = this.clients[origin];
    if (!token || !authorization) return false;
    const actual = Buffer.from(authorization), expected = Buffer.from(`Bearer ${token}`);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  start(origin: string, nonce: string) {
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
    void this.approve(origin).then(async approved => {
      if (challenge.expires < Date.now()) return;
      if (!approved) { challenge.state = 'denied'; return; }
      const token = randomBytes(32).toString('hex');
      const previous = this.clients[origin];
      this.clients[origin] = token;
      try { await this.save(); challenge.token = token; challenge.state = 'approved'; }
      catch { if (previous) this.clients[origin] = previous; else delete this.clients[origin]; challenge.state = 'denied'; }
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
