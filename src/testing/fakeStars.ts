import type { Star } from '../features/stars/star'
import type { OpenedState, StarRepository } from '../features/stars/starRepository'

/** A quiet StarRepository for screen tests; override what a test needs. */
export function fakeStarRepository(overrides: Partial<StarRepository> = {}): StarRepository {
  let n = 0
  return {
    newDraftId: () => `draft-${++n}`,
    send: async () => {},
    watchWritten: (cb) => {
      cb([])
      return () => {}
    },
    watchReceived: (cb) => {
      cb([])
      return () => {}
    },
    watchOpened: (_day, cb) => {
      cb({ opened: new Set(), doneToday: false })
      return () => {}
    },
    openToday: async () => 'opened',
    loadPhoto: async () => null,
    ...overrides,
  }
}

export const receivedStars = (stars: Star[]) => (cb: (s: Star[]) => void) => {
  cb(stars)
  return () => {}
}

export const openedState = (state: OpenedState) => (_day: number, cb: (s: OpenedState) => void) => {
  cb(state)
  return () => {}
}
