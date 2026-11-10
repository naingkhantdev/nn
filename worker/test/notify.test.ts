import { describe, expect, it, vi } from 'vitest'
import { handleNotify, type Deps } from '../src/notify'
import { copy } from '../src/copy'
import { createRateLimiter } from '../src/rateLimit'

const OWNER = 'owner'
const HER = 'her'

function makeDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    verifyIdToken: vi.fn(async (t: string) => (t === 'good-owner' ? OWNER : t === 'good-her' ? HER : t === 'good-stranger' ? 'stranger' : null)),
    getMemberUids: vi.fn(async () => [OWNER, HER]),
    getDeviceToken: vi.fn(async (uid: string) => `token-of-${uid}`),
    sendFcm: vi.fn(async () => 'ok' as const),
    rateLimit: vi.fn(() => true),
    ...overrides,
  }
}

function req(body: unknown, token: string | null = 'good-owner') {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return new Request('https://worker.test/notify', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('handleNotify', () => {
  it('rejects a missing token with 401', async () => {
    const deps = makeDeps()
    expect((await handleNotify(req({ type: 'star_new' }, null), deps)).status).toBe(401)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('rejects a bad token with 401', async () => {
    const deps = makeDeps()
    expect((await handleNotify(req({ type: 'star_new' }, 'forged'), deps)).status).toBe(401)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('rejects a non-member with 403', async () => {
    const deps = makeDeps()
    expect((await handleNotify(req({ type: 'star_new' }, 'good-stranger'), deps)).status).toBe(403)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('rejects an unknown type with 400', async () => {
    const deps = makeDeps()
    expect((await handleNotify(req({ type: 'hello' }), deps)).status).toBe(400)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('rejects invalid JSON with 400', async () => {
    expect((await handleNotify(req('{not json'), makeDeps())).status).toBe(400)
  })

  it('sends to the other member only', async () => {
    const deps = makeDeps()
    expect((await handleNotify(req({ type: 'star_new' }, 'good-owner'), deps)).status).toBe(204)
    expect(deps.getDeviceToken).toHaveBeenCalledWith(HER)
    expect(deps.sendFcm).toHaveBeenCalledWith('token-of-her', copy.star_new)

    const deps2 = makeDeps()
    await handleNotify(req({ type: 'sulk_started' }, 'good-her'), deps2)
    expect(deps2.sendFcm).toHaveBeenCalledWith('token-of-owner', copy.sulk_started)
  })

  it('ignores client-supplied title and body', async () => {
    const deps = makeDeps()
    await handleNotify(req({ type: 'treat_sent', title: 'HACK', body: 'HACK' }), deps)
    expect(deps.sendFcm).toHaveBeenCalledWith('token-of-her', copy.treat_sent)
  })

  it('returns 204 without sending when the other person has no token', async () => {
    const deps = makeDeps({ getDeviceToken: vi.fn(async () => null) })
    expect((await handleNotify(req({ type: 'star_new' }), deps)).status).toBe(204)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('returns 204 when FCM says the token is unregistered', async () => {
    const deps = makeDeps({ sendFcm: vi.fn(async () => 'unregistered' as const) })
    expect((await handleNotify(req({ type: 'star_new' }), deps)).status).toBe(204)
  })

  it('returns 429 when rate-limited', async () => {
    const deps = makeDeps({ rateLimit: vi.fn(() => false) })
    expect((await handleNotify(req({ type: 'star_new' }), deps)).status).toBe(429)
    expect(deps.sendFcm).not.toHaveBeenCalled()
  })

  it('has copy for every notify type', () => {
    for (const t of ['star_new', 'treat_sent', 'sulk_started', 'sulk_comforted', 'sulk_forgiven'] as const) {
      expect(copy[t].title.length).toBeGreaterThan(0)
      expect(copy[t].body.length).toBeGreaterThan(0)
    }
  })
})

describe('createRateLimiter', () => {
  it('allows 30 per user per hour and refuses the 31st', () => {
    let now = 0
    const allow = createRateLimiter(30, 3_600_000, () => now)
    for (let i = 0; i < 30; i++) expect(allow('a')).toBe(true)
    expect(allow('a')).toBe(false)
    expect(allow('b')).toBe(true)
    now = 3_600_001
    expect(allow('a')).toBe(true)
  })
})
