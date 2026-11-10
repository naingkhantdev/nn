import type { Services } from '../core/services'
import type { FeelingDoc, Treat } from '../features/feelings/feeling'
import type { FeelingRepository } from '../features/feelings/feelingRepository'
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

export function fakeServices(overrides: Partial<Services> = {}): Services {
  return { stars: fakeStarRepository(), feelings: fakeFeelingRepository(), ...overrides }
}
