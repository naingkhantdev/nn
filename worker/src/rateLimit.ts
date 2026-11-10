// In-memory sliding-window rate limit per user. Resets when the isolate restarts,
// which is fine: it only guards against a runaway client, not an attacker.
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
) {
  const hits = new Map<string, number[]>()
  return (key: string): boolean => {
    const t = now()
    const recent = (hits.get(key) ?? []).filter((h) => t - h < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(t)
    hits.set(key, recent)
    return true
  }
}
