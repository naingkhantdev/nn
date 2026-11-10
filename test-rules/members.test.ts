import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import {
  asHer,
  asOwner,
  asStranger,
  env,
  seed,
  setup,
  signedOut,
} from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

describe('membership', () => {
  it('stranger cannot read any collection', () =>
    assertFails(getDoc(doc(asStranger(), 'profiles/owner'))))
  it('stranger cannot read config', () =>
    assertFails(getDoc(doc(asStranger(), 'config/members'))))
  it('signed-out user cannot read', () =>
    assertFails(getDoc(doc(signedOut(), 'config/members'))))
  it('member reads config', () =>
    assertSucceeds(getDoc(doc(asHer(), 'config/members'))))
  it('member reads features', () =>
    assertSucceeds(getDoc(doc(asOwner(), 'config/features'))))
  it('member cannot write config', () =>
    assertFails(setDoc(doc(asOwner(), 'config/members'), { uids: ['owner'] })))
  it('member cannot add unknown collection', () =>
    assertFails(setDoc(doc(asOwner(), 'other/x'), { a: 1 })))
})

describe('profiles', () => {
  it('profile writable only by its owner', async () => {
    await assertSucceeds(
      setDoc(doc(asHer(), 'profiles/her'), {
        displayName: 'A',
        phraseChosen: true,
      }),
    )
    await assertFails(
      setDoc(doc(asOwner(), 'profiles/her'), {
        displayName: 'B',
        phraseChosen: true,
      }),
    )
  })
  it('the other member can read a profile', async () => {
    await setDoc(doc(asHer(), 'profiles/her'), {
      displayName: 'A',
      phraseChosen: true,
    })
    await assertSucceeds(getDoc(doc(asOwner(), 'profiles/her')))
  })
  it('profile rejects unknown fields and wrong types', async () => {
    await assertFails(
      setDoc(doc(asHer(), 'profiles/her'), {
        displayName: 'A',
        phraseChosen: true,
        x: 1,
      }),
    )
    await assertFails(
      setDoc(doc(asHer(), 'profiles/her'), {
        displayName: 5,
        phraseChosen: true,
      }),
    )
  })
  it('stranger cannot create a profile for themselves', () =>
    assertFails(
      setDoc(doc(asStranger(), 'profiles/stranger'), {
        displayName: 'S',
        phraseChosen: true,
      }),
    ))
  it('owner of a profile can delete it', async () => {
    await setDoc(doc(asHer(), 'profiles/her'), {
      displayName: 'A',
      phraseChosen: true,
    })
    await assertSucceeds(deleteDoc(doc(asHer(), 'profiles/her')))
  })
})
