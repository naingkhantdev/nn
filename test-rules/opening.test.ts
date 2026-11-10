import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { asHer, asOwner, env, seed, setup } from './helpers'

beforeAll(setup)
afterAll(() => env.cleanup())

// Server-decided Myanmar day, same formula as firestore.rules and src/core/time.ts.
const today = () => Math.floor((Date.now() + 23_400_000) / 86_400_000)

beforeEach(() =>
  seed(async (db) => {
    for (const id of ['s1', 's2']) {
      await setDoc(doc(db, 'stars', id), {
        fromUid: 'owner',
        toUid: 'her',
        text: id,
        hasPhoto: false,
        createdAt: new Date(),
      })
    }
  }),
)

type Db = ReturnType<typeof asHer>

function open(db: Db, uid: string, starId: string, day: number | string = today()) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'openedStars', uid, 'items', starId), { openedAt: serverTimestamp() })
  batch.set(doc(db, 'openedStars', uid, 'days', String(day)), { starId })
  return batch.commit()
}

describe('opening stars', () => {
  it('the recipient opens a star with items + days in one batch', () => assertSucceeds(open(asHer(), 'her', 's1')))

  it('a second star on the same Myanmar day is refused', async () => {
    await assertSucceeds(open(asHer(), 'her', 's1'))
    await assertFails(open(asHer(), 'her', 's2'))
  })

  it('the next day works again', async () => {
    // Yesterday's open already exists (seeded); today's is still free.
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'openedStars/her/items/s1'), { openedAt: new Date() })
      await setDoc(doc(db, `openedStars/her/days/${today() - 1}`), { starId: 's1' })
    })
    await assertSucceeds(open(asHer(), 'her', 's2'))
  })

  it("a day that is not the server's today is refused, whatever the phone says", async () => {
    await assertFails(open(asHer(), 'her', 's1', today() + 1))
    await assertFails(open(asHer(), 'her', 's1', today() - 1))
    await assertFails(open(asHer(), 'her', 's1', 'tomorrow'))
  })

  it('the writer cannot open a star for the recipient, or for themselves', async () => {
    await assertFails(open(asOwner(), 'her', 's1'))
    await assertFails(open(asOwner(), 'owner', 's1'))
  })

  it('items without its days doc is refused, and days without items too', async () => {
    const her = asHer()
    await assertFails(setDoc(doc(her, 'openedStars/her/items/s1'), { openedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(her, `openedStars/her/days/${today()}`), { starId: 's1' }))
  })

  it('the days doc must point at the opened star', async () => {
    const her = asHer()
    const batch = writeBatch(her)
    batch.set(doc(her, 'openedStars/her/items/s1'), { openedAt: serverTimestamp() })
    batch.set(doc(her, `openedStars/her/days/${today()}`), { starId: 's2' })
    await assertFails(batch.commit())
  })

  it('cannot open a star addressed to someone else', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'stars/toOwner'), {
        fromUid: 'her',
        toUid: 'owner',
        text: 'x',
        hasPhoto: false,
        createdAt: new Date(),
      })
    })
    await assertFails(open(asHer(), 'her', 'toOwner'))
  })
})
