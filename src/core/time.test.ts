import { describe, expect, it } from 'vitest'
import { feelingFade, hasFaded, myanmarDayNumber, myanmarHour, sulkFade } from './time'

describe('myanmarDayNumber', () => {
  it('23:59 Myanmar and 00:00 Myanmar are different days', () => {
    // 17:29 UTC = 23:59 MMT, 17:30 UTC = 00:00 MMT next day
    expect(myanmarDayNumber(Date.UTC(2026, 10, 6, 17, 29)) + 1).toBe(
      myanmarDayNumber(Date.UTC(2026, 10, 6, 17, 30)),
    )
  })
  it('the same Myanmar day spans UTC midnight', () => {
    // 20:00 UTC Nov 6 = 02:30 MMT Nov 7; 10:00 UTC Nov 7 = 16:30 MMT Nov 7
    expect(myanmarDayNumber(Date.UTC(2026, 10, 6, 20, 0))).toBe(
      myanmarDayNumber(Date.UTC(2026, 10, 7, 10, 0)),
    )
  })
  it('matches the rules formula', () => {
    const ms = Date.UTC(2026, 10, 10, 3, 0)
    expect(myanmarDayNumber(ms)).toBe(Math.floor((ms + 23_400_000) / 86_400_000))
  })
})

describe('myanmarHour', () => {
  it('converts UTC to Myanmar hour', () => {
    expect(myanmarHour(Date.UTC(2026, 10, 6, 17, 30))).toBe(0)
    expect(myanmarHour(Date.UTC(2026, 10, 6, 16, 30))).toBe(23)
    expect(myanmarHour(Date.UTC(2026, 10, 6, 0, 0))).toBe(6)
  })
})

describe('hasFaded', () => {
  const start = Date.UTC(2026, 10, 6, 0, 0)
  it('a feeling at 7h59m has not faded and at 8h has', () => {
    expect(hasFaded(start, start + 8 * 3_600_000 - 60_000, feelingFade)).toBe(false)
    expect(hasFaded(start, start + 8 * 3_600_000, feelingFade)).toBe(true)
  })
  it('a sulk fades at 24h', () => {
    expect(hasFaded(start, start + 24 * 3_600_000 - 1, sulkFade)).toBe(false)
    expect(hasFaded(start, start + 24 * 3_600_000, sulkFade)).toBe(true)
  })
})
