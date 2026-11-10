import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { createStarRepository, SendFailed } from './starRepository'

const fs = vi.hoisted(() => ({
  sets: [] as Array<{ path: string; data: Record<string, unknown> }>,
  commits: 0,
  commitImpl: async () => {},
}))

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/'), id: segments.at(-1) ?? 'auto' }),
  collection: () => ({}),
  getDoc: async () => ({ data: () => ({ uids: ['me', 'you'] }) }),
  getDocFromServer: async () => ({ exists: () => false, data: () => ({}) }),
  serverTimestamp: () => 'SERVER_TIME',
  Bytes: { fromUint8Array: (u: Uint8Array) => ({ bytes: u.byteLength }) },
  writeBatch: () => ({
    set: (ref: { path: string }, data: Record<string, unknown>) => fs.sets.push({ path: ref.path, data }),
    commit: async () => {
      fs.commits++
      await fs.commitImpl()
    },
  }),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  onSnapshot: () => () => {},
}))

const auth = { currentUser: { uid: 'me' } } as unknown as Auth
const db = {} as Firestore

function repo(notify = vi.fn().mockResolvedValue(undefined), online = true) {
  return { repo: createStarRepository({ db, auth, notify: { send: notify }, isOnline: () => online }), notify }
}

describe('starRepository.send', () => {
  beforeEach(() => {
    fs.sets = []
    fs.commits = 0
    fs.commitImpl = async () => {}
  })

  it('writes the star and its photo together in one batch, then notifies', async () => {
    const { repo: r, notify } = repo()
    await r.send({ id: 's1', text: 'hello', photo: new Uint8Array(10) })
    expect(fs.commits).toBe(1)
    expect(fs.sets.map((s) => s.path)).toEqual(['stars/s1', 'starPhotos/s1'])
    expect(fs.sets[0].data).toMatchObject({ fromUid: 'me', toUid: 'you', text: 'hello', hasPhoto: true })
    expect(fs.sets[1].data).toMatchObject({ fromUid: 'me', toUid: 'you' })
    expect(notify).toHaveBeenCalledWith('star_new')
  })

  it('writes only the star when there is no photo', async () => {
    const { repo: r } = repo()
    await r.send({ id: 's1', text: 'hello', photo: null })
    expect(fs.sets.map((s) => s.path)).toEqual(['stars/s1'])
    expect(fs.sets[0].data.hasPhoto).toBe(false)
  })

  it('a notify failure does not fail the send', async () => {
    const { repo: r } = repo(vi.fn().mockRejectedValue(new Error('push down')))
    await expect(r.send({ id: 's1', text: 'hello', photo: null })).resolves.toBeUndefined()
  })

  it('fails fast, without writing, when offline', async () => {
    const { repo: r, notify } = repo(undefined, false)
    await expect(r.send({ id: 's1', text: 'hello', photo: null })).rejects.toMatchObject({ reason: 'offline' })
    expect(fs.commits).toBe(0)
    expect(notify).not.toHaveBeenCalled()
  })

  it('reports a failed commit as SendFailed and does not notify', async () => {
    fs.commitImpl = async () => {
      throw Object.assign(new Error('nope'), { code: 'unavailable' })
    }
    const { repo: r, notify } = repo()
    await expect(r.send({ id: 's1', text: 'hello', photo: null })).rejects.toBeInstanceOf(SendFailed)
    expect(notify).not.toHaveBeenCalled()
  })
})

describe('starRepository.openToday', () => {
  // 12:00 Myanmar time on a known day.
  const noon = Date.UTC(2026, 10, 10, 5, 30)
  const day = Math.floor((noon + 23_400_000) / 86_400_000)
  const star = { id: 's1', fromUid: 'you', toUid: 'me', text: 'hi', hasPhoto: false, createdAt: null }
  const denied = () => Object.assign(new Error('denied'), { code: 'permission-denied' })

  function openRepo() {
    return createStarRepository({ db, auth, notify: { send: async () => {} }, isOnline: () => true, now: () => noon })
  }

  beforeEach(() => {
    fs.sets = []
    fs.commits = 0
    fs.commitImpl = async () => {}
  })

  it("writes the star's item and today's day in one batch", async () => {
    await expect(openRepo().openToday(star)).resolves.toBe('opened')
    expect(fs.commits).toBe(1)
    expect(fs.sets.map((s) => s.path)).toEqual(['openedStars/me/items/s1', `openedStars/me/days/${day}`])
    expect(fs.sets[1].data).toEqual({ starId: 's1' })
  })

  it('says "already opened today" when the server refuses every day', async () => {
    fs.commitImpl = async () => {
      throw denied()
    }
    await expect(openRepo().openToday(star)).resolves.toBe('alreadyOpenedToday')
    const days = fs.sets.filter((s) => s.path.includes('/days/')).map((s) => s.path.split('/').at(-1))
    expect(days).toEqual([String(day), String(day + 1), String(day - 1)])
  })

  it("still opens when the phone's clock is a day behind the server", async () => {
    let attempt = 0
    fs.commitImpl = async () => {
      if (attempt++ === 0) throw denied()
    }
    await expect(openRepo().openToday(star)).resolves.toBe('opened')
    expect(fs.commits).toBe(2)
  })

  it('reports other failures instead of pretending', async () => {
    fs.commitImpl = async () => {
      throw Object.assign(new Error('x'), { code: 'unavailable' })
    }
    await expect(openRepo().openToday(star)).rejects.toBeInstanceOf(SendFailed)
  })
})
