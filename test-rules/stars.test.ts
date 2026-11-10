import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { asHer, asOwner, asStranger, env, seed, setup } from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

type Db = ReturnType<typeof asOwner>

const star = (fromUid: string, toUid: string, text = 'hello', hasPhoto = false) => ({
  fromUid,
  toUid,
  text,
  hasPhoto,
  createdAt: serverTimestamp(),
})

/** Owner writes a text star to her, with rules disabled. */
async function seedStar(id = 's1') {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'stars', id), {
      fromUid: 'owner',
      toUid: 'her',
      text: 'hi',
      hasPhoto: false,
      createdAt: new Date(),
    })
  })
}

function sendWithPhoto(db: Db, id: string, bytes: number, photoTo = 'her') {
  const batch = writeBatch(db)
  batch.set(doc(db, 'stars', id), star('owner', 'her', 'look!', true))
  batch.set(doc(db, 'starPhotos', id), {
    fromUid: 'owner',
    toUid: photoTo,
    data: Bytes.fromUint8Array(new Uint8Array(bytes)),
  })
  return batch.commit()
}

describe('writing stars', () => {
  it('a member writes a star to the other member', () =>
    assertSucceeds(setDoc(doc(asOwner(), 'stars/a'), star('owner', 'her'))))

  it('cannot forge fromUid', () =>
    assertFails(setDoc(doc(asOwner(), 'stars/a'), star('her', 'her'))))

  it('cannot send to a stranger or to oneself', async () => {
    await assertFails(setDoc(doc(asOwner(), 'stars/a'), star('owner', 'stranger')))
    await assertFails(setDoc(doc(asOwner(), 'stars/b'), star('owner', 'owner')))
  })

  it('a stranger cannot write a star', () =>
    assertFails(setDoc(doc(asStranger(), 'stars/a'), star('stranger', 'her'))))

  it('allows 1000 characters and refuses 1001', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'stars/a'), star('owner', 'her', 'a'.repeat(1000))))
    await assertFails(setDoc(doc(asOwner(), 'stars/b'), star('owner', 'her', 'a'.repeat(1001))))
  })

  it('allows Burmese text at the limit', () =>
    assertSucceeds(setDoc(doc(asHer(), 'stars/a'), star('her', 'owner', 'မ'.repeat(1000)))))

  it('refuses an empty star without a photo', () =>
    assertFails(setDoc(doc(asOwner(), 'stars/a'), star('owner', 'her', ''))))

  it('refuses unknown fields and a client-chosen time', async () => {
    await assertFails(setDoc(doc(asOwner(), 'stars/a'), { ...star('owner', 'her'), mood: 'x' }))
    await assertFails(
      setDoc(doc(asOwner(), 'stars/b'), { ...star('owner', 'her'), createdAt: new Date(2020, 0, 1) }),
    )
  })

  it('nobody can update a star', async () => {
    await seedStar()
    await assertFails(updateDoc(doc(asOwner(), 'stars/s1'), { text: 'changed' }))
    await assertFails(updateDoc(doc(asHer(), 'stars/s1'), { text: 'changed' }))
  })
})

describe('reading stars', () => {
  it('the writer and the recipient can read; a stranger cannot', async () => {
    await seedStar()
    await assertSucceeds(getDoc(doc(asOwner(), 'stars/s1')))
    await assertSucceeds(getDoc(doc(asHer(), 'stars/s1')))
    await assertFails(getDoc(doc(asStranger(), 'stars/s1')))
  })

  it('the writer can list their own stars only through a fromUid query', async () => {
    await seedStar()
    const owner = asOwner()
    await assertSucceeds(getDocs(query(collection(owner, 'stars'), where('fromUid', '==', 'owner'))))
    await assertFails(getDocs(collection(owner, 'stars')))
  })

  it('the writer cannot read the recipient’s opened state', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'openedStars/her/items/s1'), { openedAt: new Date() })
      await setDoc(doc(db, 'openedStars/her/days/20000'), { starId: 's1' })
    })
    await assertFails(getDoc(doc(asOwner(), 'openedStars/her/items/s1')))
    await assertFails(getDoc(doc(asOwner(), 'openedStars/her/days/20000')))
  })

  it('either party can delete a star', async () => {
    await seedStar('s1')
    await seedStar('s2')
    await assertSucceeds(deleteDoc(doc(asOwner(), 'stars/s1')))
    await assertSucceeds(deleteDoc(doc(asHer(), 'stars/s2')))
  })
})

describe('star photos', () => {
  it('a star and its photo are written together', () => assertSucceeds(sendWithPhoto(asOwner(), 'p1', 300_000)))

  it('accepts 900000 bytes and refuses 900001', async () => {
    await assertSucceeds(sendWithPhoto(asOwner(), 'p1', 900_000))
    await assertFails(sendWithPhoto(asOwner(), 'p2', 900_001))
  })

  it('a star claiming a photo needs the photo in the same batch', () =>
    assertFails(setDoc(doc(asOwner(), 'stars/p1'), star('owner', 'her', 'look!', true))))

  it('a photo must match its star', () => assertFails(sendWithPhoto(asOwner(), 'p1', 1000, 'owner')))

  it('the recipient reads the photo; a stranger cannot', async () => {
    await sendWithPhoto(asOwner(), 'p1', 1000)
    await assertSucceeds(getDoc(doc(asHer(), 'starPhotos/p1')))
    await assertFails(getDoc(doc(asStranger(), 'starPhotos/p1')))
  })
})
