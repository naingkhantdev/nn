import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { asHer, asOwner, asStranger, env, seed, setup } from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

describe('devices (push tokens)', () => {
  it('each person writes, reads and deletes only their own token', async () => {
    await assertSucceeds(setDoc(doc(asHer(), 'devices/her'), { token: 'abc' }))
    await assertSucceeds(getDoc(doc(asHer(), 'devices/her')))
    await assertSucceeds(deleteDoc(doc(asHer(), 'devices/her')))
  })

  it("the other member can neither read nor touch someone's token", async () => {
    await setDoc(doc(asHer(), 'devices/her'), { token: 'abc' })
    await assertFails(getDoc(doc(asOwner(), 'devices/her')))
    await assertFails(setDoc(doc(asOwner(), 'devices/her'), { token: 'evil' }))
    await assertFails(deleteDoc(doc(asOwner(), 'devices/her')))
  })

  it('only a string token, no extra fields', async () => {
    await assertFails(setDoc(doc(asHer(), 'devices/her'), { token: 42 }))
    await assertFails(setDoc(doc(asHer(), 'devices/her'), { token: 'abc', lastSeen: 1 }))
    await assertFails(setDoc(doc(asHer(), 'devices/her'), { token: 'x'.repeat(4097) }))
  })

  it('a stranger cannot store a token', () =>
    assertFails(setDoc(doc(asStranger(), 'devices/stranger'), { token: 'abc' })))
})
