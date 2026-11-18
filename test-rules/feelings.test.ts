import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { asHer, asOwner, asStranger, env, seed, setup } from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

const feeling = (name: string) => ({ feeling: name, setAt: serverTimestamp() })

describe('feelings', () => {
  it('each person writes their own feeling, which the other can read', async () => {
    await assertSucceeds(setDoc(doc(asHer(), 'feelings/her'), feeling('sleepy')))
    await assertSucceeds(setDoc(doc(asHer(), 'feelings/her'), feeling('hungry')))
    await assertSucceeds(getDoc(doc(asOwner(), 'feelings/her')))
  })

  it("the other member cannot write someone's feeling", () =>
    assertFails(setDoc(doc(asOwner(), 'feelings/her'), feeling('happy'))))

  it('setAt must be the server time', () =>
    assertFails(setDoc(doc(asHer(), 'feelings/her'), { feeling: 'happy', setAt: new Date() })))

  it('an unknown feeling or extra field is refused', async () => {
    await assertFails(setDoc(doc(asHer(), 'feelings/her'), feeling('furious')))
    await assertFails(setDoc(doc(asHer(), 'feelings/her'), { ...feeling('happy'), note: 'x' }))
  })

  it('"nothing right now" deletes it; only its owner can', async () => {
    await setDoc(doc(asHer(), 'feelings/her'), feeling('tired'))
    await assertFails(deleteDoc(doc(asOwner(), 'feelings/her')))
    await assertSucceeds(deleteDoc(doc(asHer(), 'feelings/her')))
  })

  it('a stranger can neither read nor write feelings', async () => {
    await assertFails(getDoc(doc(asStranger(), 'feelings/her')))
    await assertFails(setDoc(doc(asStranger(), 'feelings/stranger'), feeling('happy')))
  })
})

describe('treats', () => {
  const treat = (fromUid: string, toUid: string, kind = 'blanket') => ({ fromUid, toUid, kind })

  it('the sender creates a treat for the other member', () =>
    assertSucceeds(setDoc(doc(asOwner(), 'treats/t1'), treat('owner', 'her'))))

  it('cannot forge the sender, send to oneself or a stranger, or invent a kind', async () => {
    await assertFails(setDoc(doc(asOwner(), 'treats/a'), treat('her', 'her')))
    await assertFails(setDoc(doc(asOwner(), 'treats/b'), treat('owner', 'owner')))
    await assertFails(setDoc(doc(asOwner(), 'treats/c'), treat('owner', 'stranger')))
    await assertFails(setDoc(doc(asOwner(), 'treats/d'), treat('owner', 'her', 'diamond')))
  })

  it('both members can remove their own treats during account cleanup', async () => {
    await setDoc(doc(asOwner(), 'treats/t1'), treat('owner', 'her'))
    await setDoc(doc(asHer(), 'treats/t2'), treat('her', 'owner'))
    await assertSucceeds(getDoc(doc(asOwner(), 'treats/t1')))
    await assertFails(getDoc(doc(asStranger(), 'treats/t1')))
    await assertSucceeds(getDocs(query(collection(asHer(), 'treats'), where('toUid', '==', 'her'))))
    await assertSucceeds(getDocs(query(collection(asOwner(), 'treats'), where('fromUid', '==', 'owner'))))
    await assertSucceeds(deleteDoc(doc(asOwner(), 'treats/t1')))
    await assertSucceeds(deleteDoc(doc(asHer(), 'treats/t2')))
  })
})
