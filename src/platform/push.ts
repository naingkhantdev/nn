// Push notifications: optional everywhere. The app is fully usable without them.
// The browser parts are injected (PushDeps) so the logic is easy to test.

export type PushResult = 'enabled' | 'denied' | 'unsupported'

/** off = possible but not turned on; denied = the browser has blocked it. */
export type PushState = 'unsupported' | 'off' | 'on' | 'denied'

export interface PushService {
  state(): PushState
  /** Asks for permission (only when called from a tap) and stores the token. */
  enable(): Promise<PushResult>
  /** Deletes the token and its devices/{uid} doc. */
  disable(): Promise<void>
  /** Re-saves the current token while push is on; never throws. */
  refresh(): Promise<void>
}

export interface PushDeps {
  supported: boolean
  permission: () => NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  getToken: () => Promise<string>
  deleteToken: () => Promise<void>
  saveToken: (token: string) => Promise<void>
  removeToken: () => Promise<void>
}

// Remembers that push was turned on, on this phone only.
const ON_KEY = 'mochi.push.on'

function readOn(): boolean {
  try {
    return localStorage.getItem(ON_KEY) === '1'
  } catch {
    return false
  }
}

function writeOn(on: boolean): void {
  try {
    if (on) localStorage.setItem(ON_KEY, '1')
    else localStorage.removeItem(ON_KEY)
  } catch {
    // Blocked storage: push still works this session.
  }
}

export function createPushService(deps: PushDeps): PushService {
  let on = readOn()

  return {
    state() {
      if (!deps.supported) return 'unsupported'
      const permission = deps.permission()
      if (permission === 'denied') return 'denied'
      return permission === 'granted' && on ? 'on' : 'off'
    },

    async enable() {
      if (!deps.supported) return 'unsupported'
      const permission = await deps.requestPermission()
      if (permission !== 'granted') return 'denied'
      await deps.saveToken(await deps.getToken())
      on = true
      writeOn(true)
      return 'enabled'
    },

    async disable() {
      on = false
      writeOn(false)
      await Promise.allSettled([deps.deleteToken(), deps.removeToken()])
    },

    async refresh() {
      if (!deps.supported || !on || deps.permission() !== 'granted') return
      try {
        await deps.saveToken(await deps.getToken())
      } catch {
        // Offline or the push service is down: try again next launch.
      }
    },
  }
}
