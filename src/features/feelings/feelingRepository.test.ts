import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { createFeelingRepository, TreatFailed } from './feelingRepository'

const fs = vi.hoisted(() => ({
  calls: [] as Array<{ op: string; path: string; data?: unknown }>,
}))

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  getDoc: async () => ({ exists: () => true, data: () => ({ uids: ['me', 'you'] }) }),
  setDoc: async (ref: { path: string }, data: unknown) => {
    fs.calls.push({ op: 'set', path: ref.path, data })
  },
  addDoc: async (ref: { path: string }, data: unknown) => {
    fs.calls.push({ op: 'add', path: ref.path, data })
  },
  deleteDoc: async (ref: { path: string }) => {
    fs.calls.push({ op: 'delete', path: ref.path })
  },
  serverTimestamp: () => 'SERVER_TIME',
  onSnapshot: () => () => {},
  query: () => ({}),
  where: () => ({}),
}))

const auth = { currentUser: { uid: 'me' } } as unknown as Auth
const db = {} as Firestore

function repo(online = true) {
  const notify = { send: vi.fn().mockResolvedValue(undefined) }
  return { r: createFeelingRepository({ db, auth, notify, isOnline: () => online }), notify }
}

describe('feelingRepository', () => {
  beforeEach(() => {
    fs.calls = []
  })

  it('setting a feeling overwrites my one doc, keeps no history, and notifies nobody', async () => {
    const { r, notify } = repo()
    r.set('sleepy')
    r.set('hungry')
    await Promise.resolve()
    expect(fs.calls).toEqual([
      { op: 'set', path: 'feelings/me', data: { feeling: 'sleepy', setAt: 'SERVER_TIME' } },
      { op: 'set', path: 'feelings/me', data: { feeling: 'hungry', setAt: 'SERVER_TIME' } },
    ])
    expect(notify.send).not.toHaveBeenCalled()
  })

  it('"nothing right now" deletes my feeling doc', async () => {
    const { r } = repo()
    r.clear()
    await Promise.resolve()
    expect(fs.calls).toEqual([{ op: 'delete', path: 'feelings/me' }])
  })

  it('sending a treat writes it to the other person and sends one notification', async () => {
    const { r, notify } = repo()
    await r.sendTreat('blanket')
    expect(fs.calls).toEqual([{ op: 'add', path: 'treats', data: { fromUid: 'me', toUid: 'you', kind: 'blanket' } }])
    expect(notify.send).toHaveBeenCalledWith('treat_sent')
    expect(notify.send).toHaveBeenCalledTimes(1)
  })

  it('a treat fails kindly when offline', async () => {
    const { r, notify } = repo(false)
    await expect(r.sendTreat('hug')).rejects.toBeInstanceOf(TreatFailed)
    expect(notify.send).not.toHaveBeenCalled()
  })

  it('dismissing a treat deletes it', async () => {
    const { r } = repo()
    r.dismissTreat('t1')
    await Promise.resolve()
    expect(fs.calls).toEqual([{ op: 'delete', path: 'treats/t1' }])
  })
})
