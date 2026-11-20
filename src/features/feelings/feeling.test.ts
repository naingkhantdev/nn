import { describe, expect, it } from 'vitest'
import { activeActivity, activeFeeling, activities, expressionFor, expressionForActivity, feelings, treatFor } from './feeling'

const HOUR = 3_600_000
const setAt = new Date(Date.UTC(2026, 10, 10, 0, 0))

describe('activeFeeling', () => {
  it('shows at 7h59m and is gone at 8h', () => {
    const doc = { feeling: 'sleepy' as const, setAt }
    expect(activeFeeling(doc, setAt.getTime() + 8 * HOUR - 60_000)).toBe('sleepy')
    expect(activeFeeling(doc, setAt.getTime() + 8 * HOUR)).toBeNull()
  })

  it('shows a just-set feeling that the server has not stamped yet', () => {
    expect(activeFeeling({ feeling: 'happy', setAt: null }, Date.now())).toBe('happy')
  })

  it('is null when nothing is shared', () => {
    expect(activeFeeling(null, Date.now())).toBeNull()
  })
})

describe('activeActivity', () => {
  it('shows a chosen activity for eight hours, then clears it', () => {
    const doc = { activity: 'coding' as const, setAt }
    expect(activeActivity(doc, setAt.getTime() + 8 * HOUR - 60_000)).toBe('coding')
    expect(activeActivity(doc, setAt.getTime() + 8 * HOUR)).toBeNull()
  })

  it('maps every activity to a Mochi expression', () => {
    for (const activity of activities) expect(expressionForActivity(activity)).toBeTruthy()
  })
})

describe('expressionFor and treatFor', () => {
  it('maps every feeling', () => {
    for (const f of feelings) {
      expect(expressionFor(f)).toBeTruthy()
      expect(treatFor(f)).toBeTruthy()
    }
    expect(expressionFor('missingHome')).toBe('homesick')
    expect(treatFor('hungry')).toBe('snack')
    expect(treatFor('sleepy')).toBe('blanket')
  })
})
