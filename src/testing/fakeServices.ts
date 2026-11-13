import type { Services } from '../core/services'
import type { FeelingDoc, Treat } from '../features/feelings/feeling'
import type { FeelingRepository } from '../features/feelings/feelingRepository'
import type { PushService, PushState } from '../platform/push'
import { fakeStarRepository } from './fakeStars'

/** A quiet FeelingRepository for screen tests; override what a test needs. */
export function fakeFeelingRepository(overrides: Partial<FeelingRepository> = {}): FeelingRepository {
  return {
    watchMine: (cb) => {
      cb(null)
      return () => {}
    },
    watchOther: (cb) => {
      cb(null)
      return () => {}
    },
    set: () => {},
    clear: () => {},
    sendTreat: async () => {},
    watchTreats: (cb) => {
      cb([])
      return () => {}
    },
    dismissTreat: () => {},
    ...overrides,
  }
}

export const feelingDoc = (doc: FeelingDoc | null) => (cb: (d: FeelingDoc | null) => void) => {
  cb(doc)
  return () => {}
}

export const treatList = (treats: Treat[]) => (cb: (t: Treat[]) => void) => {
  cb(treats)
  return () => {}
}

/** Push that does nothing; defaults to unsupported so no prompt appears. */
export function fakePushService(state: PushState = 'unsupported', overrides: Partial<PushService> = {}): PushService {
  return {
    state: () => state,
    enable: async () => 'enabled',
    disable: async () => {},
    refresh: async () => {},
    ...overrides,
  }
}

export function fakeServices(overrides: Partial<Services> = {}): Services {
  return {
    stars: fakeStarRepository(),
    feelings: fakeFeelingRepository(),
    push: fakePushService(),
    ...overrides,
  }
}
