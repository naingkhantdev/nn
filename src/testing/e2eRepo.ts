import type { AuthRepository } from '../features/auth/authRepository'

/**
 * A signed-in fake session for Playwright screenshots of screens behind login.
 * Only reachable in builds made with `--mode e2e` (VITE_E2E=true) and a `?e2e`
 * URL; production builds drop it entirely.
 */
export function createE2eRepository(): AuthRepository {
  return {
    onSession: (cb) => {
      const t = setTimeout(() => cb({ uid: 'e2e-user' }), 0)
      return () => clearTimeout(t)
    },
    watchProfile: (_uid, cb) => {
      const t = setTimeout(() => cb({ phraseChosen: true }), 0)
      return () => clearTimeout(t)
    },
    signIn: async () => {},
    changePhrase: async () => {},
    reauthenticate: async () => {},
    signOut: async () => {},
  }
}
