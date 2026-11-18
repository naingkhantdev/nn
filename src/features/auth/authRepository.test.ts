import { describe, expect, it } from 'vitest'
import { AuthFailure, MIN_PHRASE_LENGTH, toAuthFailure, usernameToEmail, validatePhrase } from './authRepository'

describe('usernameToEmail', () => {
  it('trims, lowercases, and appends the private domain', () => {
    expect(usernameToEmail(' Khant ')).toBe('khant@mochi-island.invalid')
    expect(usernameToEmail('NOE')).toBe('noe@mochi-island.invalid')
  })
})

describe('toAuthFailure', () => {
  const code = (c: string) => toAuthFailure(Object.assign(new Error(c), { code: c })).kind

  it('treats every "who are you" error as a wrong phrase', () => {
    expect(code('auth/invalid-credential')).toBe('wrongPhrase')
    expect(code('auth/wrong-password')).toBe('wrongPhrase')
    expect(code('auth/user-not-found')).toBe('wrongPhrase')
    expect(code('auth/invalid-email')).toBe('wrongPhrase')
  })

  it('maps network, rate-limit, and recent-login errors', () => {
    expect(code('auth/network-request-failed')).toBe('offline')
    expect(code('auth/too-many-requests')).toBe('tooMany')
    expect(code('auth/requires-recent-login')).toBe('needsReauth')
    expect(code('permission-denied')).toBe('membership')
  })

  it('falls back to unknown, and keeps an existing AuthFailure', () => {
    expect(code('auth/something-new')).toBe('unknown')
    expect(toAuthFailure('boom').kind).toBe('unknown')
    const f = new AuthFailure('offline')
    expect(toAuthFailure(f)).toBe(f)
  })
})

describe('validatePhrase', () => {
  it('refuses a phrase shorter than the minimum', () => {
    expect(MIN_PHRASE_LENGTH).toBe(6)
    expect(validatePhrase('12345', '12345')).toBe('tooShort')
    expect(validatePhrase('     a', '     a')).toBe('tooShort')
  })
  it('refuses a mismatch', () => {
    expect(validatePhrase('123456', '123457')).toBe('mismatch')
  })
  it('accepts a long enough matching phrase, including Burmese', () => {
    expect(validatePhrase('123456', '123456')).toBeNull()
    expect(validatePhrase('မိုချီလေးချစ်တယ်', 'မိုချီလေးချစ်တယ်')).toBeNull()
  })
})
