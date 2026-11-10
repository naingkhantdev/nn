import { beforeEach, describe, expect, it } from 'vitest'
import { HAPPY_FOR_MS, moodFor, readCare, recordCare } from './mochiMood'

// Myanmar time is UTC+6:30, so 12:00 MMT = 05:30 UTC.
const mmt = (hour: number, minute = 0) => Date.UTC(2026, 10, 10, hour, minute) - 6.5 * 3_600_000
const MIN = 60_000

describe('moodFor', () => {
  it('is sleepy late at night (23:00 to 06:00 Myanmar time)', () => {
    expect(moodFor({ now: mmt(23, 0) })).toBe('sleepy')
    expect(moodFor({ now: mmt(2, 30) })).toBe('sleepy')
    expect(moodFor({ now: mmt(5, 59) })).toBe('sleepy')
  })

  it('is idle in the daytime', () => {
    expect(moodFor({ now: mmt(6, 0) })).toBe('idle')
    expect(moodFor({ now: mmt(12, 0) })).toBe('idle')
    expect(moodFor({ now: mmt(22, 59) })).toBe('idle')
  })

  it('is happy within 5 minutes of petting, even at night', () => {
    expect(HAPPY_FOR_MS).toBe(5 * MIN)
    expect(moodFor({ now: mmt(12, 0), lastPetted: mmt(11, 57) })).toBe('happy')
    expect(moodFor({ now: mmt(1, 0), lastPetted: mmt(0, 58) })).toBe('happy')
  })

  it('is happy within 5 minutes of feeding', () => {
    expect(moodFor({ now: mmt(12, 0), lastFed: mmt(11, 56) })).toBe('happy')
  })

  it('goes back to normal after 5 minutes', () => {
    expect(moodFor({ now: mmt(12, 0), lastPetted: mmt(11, 55) })).toBe('idle')
  })

  it('never turns sad, sulky, or hungry after a long gap', () => {
    const yearAgo = mmt(12, 0) - 365 * 24 * 60 * MIN
    for (const hour of [0, 6, 12, 18, 23]) {
      const mood = moodFor({ now: mmt(hour), lastPetted: yearAgo, lastFed: yearAgo })
      expect(['idle', 'sleepy']).toContain(mood)
    }
  })

  it('ignores times in the future (wrong phone clock)', () => {
    expect(moodFor({ now: mmt(12, 0), lastPetted: mmt(18, 0) })).toBe('idle')
  })
})

describe('care store', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty and remembers petting and feeding on this device', () => {
    expect(readCare()).toEqual({})
    recordCare('pet', 1000)
    recordCare('feed', 2000)
    expect(readCare()).toEqual({ lastPetted: 1000, lastFed: 2000 })
  })

  it('ignores junk in storage', () => {
    localStorage.setItem('mochi.lastPetted', 'not a number')
    expect(readCare()).toEqual({})
  })
})
