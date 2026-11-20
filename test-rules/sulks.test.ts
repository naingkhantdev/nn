import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { asOwner, asHer, env, seed, setup } from './helpers'

beforeAll(setup)
beforeEach(() => seed())
afterAll(() => env.cleanup())

async function setSulkEnabled(enabled: boolean) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'config/features'), { sulk: enabled })
  })
}

function startSulk(db: ReturnType<typeof asOwner>) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'sulks/s1'), {
    sulkerUid: 'owner',
    level: 'cloudy',
    reason: '',
    startedAt: serverTimestamp(),
    endedAt: null,
    comfortCount: 0,
  })
  batch.set(doc(db, 'sulkPointers/owner'), {
    activeSulkId: 's1',
    startedAt: serverTimestamp(),
  })
  return batch.commit()
}

describe('sulk feature flag', () => {
  it('blocks starting a sulk while the feature is disabled', () =>
    assertFails(startSulk(asOwner())))

  it('allows starting a sulk after the feature is enabled', async () => {
    await setSulkEnabled(true)
    await assertSucceeds(startSulk(asOwner()))
  })

  it('blocks comfort writes while the feature is disabled', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sulks/s1'), {
        sulkerUid: 'owner', level: 'cloudy', reason: '',
        startedAt: serverTimestamp(), endedAt: null, comfortCount: 0,
      })
    })

    const db = asHer()
    const batch = writeBatch(db)
    batch.update(doc(db, 'sulks/s1'), { comfortCount: 1, lastComfortId: 'c1' })
    batch.set(doc(collection(db, 'sulkComforts'), 'c1'), {
      comfortId: 'c1', sulkId: 's1', fromUid: 'her', toUid: 'owner',
      kind: 'hug', text: '', createdAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })
})
