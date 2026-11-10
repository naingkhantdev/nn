import { describe, expect, it } from 'vitest'
import { createShakeCounter } from './shake'

describe('createShakeCounter', () => {
  it('fires on two strong jolts within 800 ms', () => {
    const feed = createShakeCounter()
    expect(feed(16, 0)).toBe(false)
    expect(feed(17, 500)).toBe(true)
  })

  it('ignores gentle movement', () => {
    const feed = createShakeCounter()
    expect(feed(10, 0)).toBe(false)
    expect(feed(14.9, 100)).toBe(false)
  })

  it('needs both jolts inside the window', () => {
    const feed = createShakeCounter()
    expect(feed(16, 0)).toBe(false)
    expect(feed(16, 900)).toBe(false)
    expect(feed(16, 1500)).toBe(true)
  })

  it('stays quiet for a moment after a shake', () => {
    const feed = createShakeCounter()
    feed(16, 0)
    expect(feed(16, 100)).toBe(true)
    expect(feed(16, 300)).toBe(false)
    expect(feed(16, 500)).toBe(false)
  })
})
