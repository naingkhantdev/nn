import { describe, expect, it } from 'vitest'
import { otherUidOf } from './members'

describe('otherUidOf', () => {
  it('returns the other member', () => {
    expect(otherUidOf(['a', 'b'], 'a')).toBe('b')
    expect(otherUidOf(['a', 'b'], 'b')).toBe('a')
  })
  it('returns null when signed out or alone', () => {
    expect(otherUidOf(['a', 'b'], null)).toBeNull()
    expect(otherUidOf(['a'], 'a')).toBeNull()
  })
})
