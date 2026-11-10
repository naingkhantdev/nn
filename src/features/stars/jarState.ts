import type { Star } from './star'

export type JarState = { kind: 'empty' } | { kind: 'ready'; next: Star } | { kind: 'doneToday' }

/** Oldest unopened star comes out first. Unstamped (just-sent) stars go last. */
export function jarStateFor(received: Star[], opened: ReadonlySet<string>, doneToday: boolean): JarState {
  if (doneToday) return { kind: 'doneToday' }
  const time = (s: Star) => s.createdAt?.getTime() ?? Number.POSITIVE_INFINITY
  const next = received
    .filter((s) => !opened.has(s.id))
    .sort((a, b) => time(a) - time(b) || a.id.localeCompare(b.id))[0]
  return next ? { kind: 'ready', next } : { kind: 'empty' }
}

/** Opened stars for the keepsakes page, newest first. */
export function keepsakesFrom(received: Star[], opened: ReadonlySet<string>): Star[] {
  const time = (s: Star) => s.createdAt?.getTime() ?? 0
  return received.filter((s) => opened.has(s.id)).sort((a, b) => time(b) - time(a))
}
