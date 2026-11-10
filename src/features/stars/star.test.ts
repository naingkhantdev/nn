import { describe, expect, it } from 'vitest'
import { MAX_STAR_TEXT, checkStarText, starTextLength } from './star'

describe('starTextLength', () => {
  it('counts an emoji once, like the server', () => {
    expect(starTextLength('hi 🌟')).toBe(4)
    expect(starTextLength('မင်္ဂလာပါ')).toBe('မင်္ဂလာပါ'.length)
  })
})

describe('checkStarText', () => {
  it('accepts up to 1000 characters and refuses 1001', () => {
    expect(MAX_STAR_TEXT).toBe(1000)
    expect(checkStarText('a'.repeat(1000), false)).toBeNull()
    expect(checkStarText('a'.repeat(1001), false)).toBe('tooLong')
    expect(checkStarText('🌟'.repeat(1000), false)).toBeNull()
  })

  it('refuses an empty star unless it has a photo', () => {
    expect(checkStarText('   ', false)).toBe('empty')
    expect(checkStarText('', true)).toBeNull()
  })
})
