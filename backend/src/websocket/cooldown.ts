export class CooldownTracker {
  private lastSent = new Map<string, number>();

  constructor(private cooldownMs: number) {}

  canSend(key: string) {
    const now = Date.now();
    const last = this.lastSent.get(key) ?? 0;
    if (now - last < this.cooldownMs) return false;
    this.lastSent.set(key, now);
    return true;
  }

  mark(key: string) {
    this.lastSent.set(key, Date.now());
  }
}
