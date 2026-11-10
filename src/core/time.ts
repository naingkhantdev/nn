// Myanmar Time is UTC+6:30. Day numbers must match myanmarDay() in firestore.rules.
export const MYANMAR_OFFSET_MS = 6.5 * 3_600_000
const DAY_MS = 86_400_000

export const feelingFade = 8 * 3_600_000
export const sulkFade = 24 * 3_600_000

/** Days since the epoch, counted in Myanmar local time. */
export function myanmarDayNumber(utcMillis: number): number {
  return Math.floor((utcMillis + MYANMAR_OFFSET_MS) / DAY_MS)
}

/** Hour of day (0-23) in Myanmar local time. */
export function myanmarHour(utcMillis: number): number {
  const local = (((utcMillis + MYANMAR_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS
  return Math.floor(local / 3_600_000)
}

/** True once `durationMs` has fully passed since `startMillis`. */
export function hasFaded(startMillis: number, nowMillis: number, durationMs: number): boolean {
  return nowMillis - startMillis >= durationMs
}
