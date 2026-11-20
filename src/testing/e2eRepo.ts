import type { Services } from '../core/services'
import type { AuthRepository } from '../features/auth/authRepository'
import type { ActivityDoc, FeelingDoc } from '../features/feelings/feeling'
import type { Star } from '../features/stars/star'
import { fakeIslandRepository } from './fakeServices'

/** In-memory services for e2e screenshots: nothing reaches Firebase. */
export function createE2eServices(): Services {
  let n = 0
  const written: Star[] = [
    {
      id: 'w1',
      fromUid: 'e2e-user',
      toUid: 'other',
      text: 'You make every day softer 🌸',
      hasPhoto: false,
      createdAt: new Date(2026, 10, 9),
    },
    {
      id: 'w2',
      fromUid: 'e2e-user',
      toUid: 'other',
      text: '',
      hasPhoto: true,
      createdAt: new Date(2026, 10, 8),
    },
  ]
  const received: Star[] = [
    {
      id: 'r1',
      fromUid: 'other',
      toUid: 'e2e-user',
      text: 'Good morning! I hope today is gentle with you. ☀️ မင်္ဂလာနံနက်ခင်းပါ',
      hasPhoto: false,
      createdAt: new Date(2026, 10, 7),
    },
    {
      id: 'r2',
      fromUid: 'other',
      toUid: 'e2e-user',
      text: 'Another one for tomorrow',
      hasPhoto: false,
      createdAt: new Date(2026, 10, 9),
    },
  ]
  const opened = new Set<string>()
  let doneToday = false
  const openedListeners = new Set<
    (s: { opened: Set<string>; doneToday: boolean }) => void
  >()
  const emitOpened = () =>
    openedListeners.forEach((cb) => cb({ opened: new Set(opened), doneToday }))

  return {
    stars: {
      newDraftId: () => `e2e-draft-${++n}`,
      send: (draft) =>
        new Promise((resolve) => {
          setTimeout(() => {
            written.unshift({
              id: draft.id,
              fromUid: 'e2e-user',
              toUid: 'other',
              text: draft.text,
              hasPhoto: !!draft.photo,
              createdAt: new Date(),
            })
            resolve()
          }, 300)
        }),
      watchWritten: (cb) => {
        cb([...written])
        return () => {}
      },
      watchReceived: (cb) => {
        cb([...received])
        return () => {}
      },
      watchOpened: (_day, cb) => {
        openedListeners.add(cb)
        cb({ opened: new Set(opened), doneToday })
        return () => openedListeners.delete(cb)
      },
      openToday: (star) =>
        new Promise((resolve) => {
          setTimeout(() => {
            if (doneToday) return resolve('alreadyOpenedToday')
            opened.add(star.id)
            doneToday = true
            emitOpened()
            resolve('opened')
          }, 400)
        }),
      loadPhoto: async () => null,
    },
    feelings: createE2eFeelings(),
    island: fakeIslandRepository(),
    // No push in e2e: the offer never appears.
    push: {
      state: () => 'unsupported',
      enable: async () => 'unsupported',
      disable: async () => {},
      refresh: async () => {},
    },
  }
}

function createE2eFeelings(): Services['feelings'] {
  let mine: FeelingDoc | null = null
  let myActivity: ActivityDoc | null = { activity: 'coding', setAt: null }
  const mineListeners = new Set<(d: FeelingDoc | null) => void>()
  const activityListeners = new Set<(d: ActivityDoc | null) => void>()
  const emitMine = () => mineListeners.forEach((cb) => cb(mine))
  const emitActivity = () => activityListeners.forEach((cb) => cb(myActivity))
  return {
    watchMine: (cb) => {
      mineListeners.add(cb)
      cb(mine)
      return () => mineListeners.delete(cb)
    },
    watchOther: (cb) => {
      cb({ feeling: 'sleepy', setAt: null })
      return () => {}
    },
    watchMyActivity: (cb) => {
      activityListeners.add(cb)
      cb(myActivity)
      return () => activityListeners.delete(cb)
    },
    watchOtherActivity: (cb) => {
      cb({ activity: 'teaching', setAt: null })
      return () => {}
    },
    set: (feeling) => {
      mine = { feeling, setAt: null }
      emitMine()
    },
    clear: () => {
      mine = null
      emitMine()
    },
    setActivity: (activity) => {
      myActivity = { activity, setAt: null }
      emitActivity()
    },
    clearActivity: () => {
      myActivity = null
      emitActivity()
    },
    sendTreat: () => new Promise((resolve) => setTimeout(resolve, 300)),
    watchTreats: (cb) => {
      cb([])
      return () => {}
    },
    dismissTreat: () => {},
  }
}

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
