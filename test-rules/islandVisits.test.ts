import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { asHer, asOwner, asStranger, env, seed, setup } from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

describe('island visits', () => {
  it('lets a member record their own visit and share it with the other member', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'islandVisits/owner'), { visitedAt: serverTimestamp() }))
    await assertSucceeds(getDoc(doc(asHer(), 'islandVisits/owner')))
  })

  it('only accepts the visitor writing their own current server timestamp', async () => {
    await assertFails(setDoc(doc(asHer(), 'islandVisits/owner'), { visitedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(asOwner(), 'islandVisits/owner'), { visitedAt: new Date() }))
    await assertFails(setDoc(doc(asOwner(), 'islandVisits/owner'), { visitedAt: serverTimestamp(), history: [] }))
  })

  it('keeps visits private to the two members and lets each visitor delete their own record', async () => {
    await setDoc(doc(asOwner(), 'islandVisits/owner'), { visitedAt: serverTimestamp() })
    await assertFails(getDoc(doc(asStranger(), 'islandVisits/owner')))
    await assertFails(deleteDoc(doc(asHer(), 'islandVisits/owner')))
    await assertSucceeds(deleteDoc(doc(asOwner(), 'islandVisits/owner')))
  })
})
