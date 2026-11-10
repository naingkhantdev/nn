import { myanmarHour } from '../../core/time'
import type { MochiExpression } from './Mochi'

/** Mochi stays happy this long after being petted or fed. */
export const HAPPY_FOR_MS = 5 * 60_000

export interface Care {
  lastPetted?: number
  lastFed?: number
}

const recent = (at: number | undefined, now: number) =>
  at !== undefined && at <= now && now - at < HAPPY_FOR_MS

/**
 * Mochi's own mood. Pure, local, and kind: it never turns sad, sick,
 * or sulky from being left alone, so it cannot pressure anyone.
 */
export function moodFor({ now, lastPetted, lastFed }: Care & { now: number }): MochiExpression {
  if (recent(lastPetted, now) || recent(lastFed, now)) return 'happy'
  const hour = myanmarHour(now)
  if (hour >= 23 || hour < 6) return 'sleepy'
  return 'idle'
}

// Stored only in this browser. Never synced, so it cannot reveal activity.
const KEYS = { pet: 'mochi.lastPetted', feed: 'mochi.lastFed' } as const

function readNumber(key: string): number | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  } catch {
    return undefined
  }
}

export function readCare(): Care {
  const care: Care = {}
  const lastPetted = readNumber(KEYS.pet)
  const lastFed = readNumber(KEYS.feed)
  if (lastPetted !== undefined) care.lastPetted = lastPetted
  if (lastFed !== undefined) care.lastFed = lastFed
  return care
}

export function recordCare(kind: 'pet' | 'feed', at: number): void {
  try {
    localStorage.setItem(KEYS[kind], String(at))
  } catch {
    // Storage blocked: Mochi is still happy for this visit.
  }
}
