import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPushService, type PushDeps } from './push'

function deps(overrides: Partial<PushDeps> = {}): PushDeps {
  return {
    supported: true,
    permission: () => 'default',
    requestPermission: vi.fn(async () => 'granted' as NotificationPermission),
    getToken: vi.fn(async () => 'token-1'),
    deleteToken: vi.fn(async () => {}),
    saveToken: vi.fn(async () => {}),
    removeToken: vi.fn(async () => {}),
    ...overrides,
  }
}

beforeEach(() => localStorage.clear())

describe('createPushService', () => {
  it('enable asks permission, then stores the token', async () => {
    let permission: NotificationPermission = 'default'
    const d = deps({
      permission: () => permission,
      requestPermission: vi.fn(
        async (): Promise<NotificationPermission> => (permission = 'granted'),
      ),
    })
    const push = createPushService(d)
    expect(push.state()).toBe('off')

    await expect(push.enable()).resolves.toBe('enabled')

    expect(d.saveToken).toHaveBeenCalledWith('token-1')
    expect(push.state()).toBe('on')
  })

  it('a refused permission stores nothing', async () => {
    const d = deps({
      requestPermission: vi.fn(async () => 'denied' as NotificationPermission),
    })
    await expect(createPushService(d).enable()).resolves.toBe('denied')
    expect(d.getToken).not.toHaveBeenCalled()
    expect(d.saveToken).not.toHaveBeenCalled()
  })

  it('an unsupported browser never asks for permission', async () => {
    const d = deps({ supported: false })
    const push = createPushService(d)
    expect(push.state()).toBe('unsupported')
    await expect(push.enable()).resolves.toBe('unsupported')
    expect(d.requestPermission).not.toHaveBeenCalled()
  })

  it('state is denied when the browser has blocked notifications', () => {
    expect(
      createPushService(deps({ permission: () => 'denied' })).state(),
    ).toBe('denied')
  })

  it('disable deletes the token and its doc', async () => {
    const d = deps({ permission: () => 'granted' })
    const push = createPushService(d)
    await push.enable()

    await push.disable()

    expect(d.deleteToken).toHaveBeenCalled()
    expect(d.removeToken).toHaveBeenCalled()
    expect(push.state()).toBe('off')
  })

  it('refresh re-saves the current token only while push is on', async () => {
    const d = deps({ permission: () => 'granted' })
    const push = createPushService(d)
    await push.refresh()
    expect(d.saveToken).not.toHaveBeenCalled()

    await push.enable()
    vi.mocked(d.getToken).mockResolvedValueOnce('token-2')
    await push.refresh()
    expect(d.saveToken).toHaveBeenLastCalledWith('token-2')
  })

  it('refresh swallows failures, since push is optional', async () => {
    const d = deps({ permission: () => 'granted' })
    const push = createPushService(d)
    await push.enable()
    vi.mocked(d.getToken).mockRejectedValueOnce(new Error('offline'))
    await expect(push.refresh()).resolves.toBeUndefined()
  })
})
