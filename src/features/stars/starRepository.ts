import type { Auth } from 'firebase/auth'
import {
  Bytes,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore'
import { myanmarDayNumber } from '../../core/time'
import type { NotifyClient } from '../../core/notifyClient'
import { otherUidOf } from '../../core/members'
import type { Star, StarDraft } from './star'

export class SendFailed extends Error {
  readonly reason: 'offline' | 'failed'
  constructor(reason: 'offline' | 'failed') {
    super(reason)
    this.name = 'SendFailed'
    this.reason = reason
  }
}

export interface StarRepository {
  /** A fresh id for a new draft; reuse it when retrying that draft. */
  newDraftId(): string
  send(draft: StarDraft): Promise<void>
  /** The stars I wrote, newest first. Never includes opened state. */
  watchWritten(cb: (stars: Star[]) => void): () => void
  /** Stars sent to me (my jar), oldest first. */
  watchReceived(cb: (stars: Star[]) => void): () => void
  /** Which of my stars I have opened, and whether `day` already had one. */
  watchOpened(day: number, cb: (state: OpenedState) => void): () => void
  /** Opens a star for today. The server decides what "today" is. */
  openToday(star: Star): Promise<OpenResult>
  /** Photo bytes for a star, loaded only when someone opens it. */
  loadPhoto(starId: string): Promise<Uint8Array | null>
}

export interface OpenedState {
  opened: Set<string>
  doneToday: boolean
}

export type OpenResult = 'opened' | 'alreadyOpenedToday'

/** A send that has not reached the server by then reports failure (text is kept). */
export const SEND_TIMEOUT_MS = 20_000

const WRITTEN_LIMIT = 30
const RECEIVED_LIMIT = 500

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new SendFailed('failed')), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export function toStar(id: string, data: Record<string, unknown>): Star {
  const created = data.createdAt as Timestamp | null | undefined
  return {
    id,
    fromUid: String(data.fromUid ?? ''),
    toUid: String(data.toUid ?? ''),
    text: String(data.text ?? ''),
    hasPhoto: data.hasPhoto === true,
    createdAt: created && typeof created.toDate === 'function' ? created.toDate() : null,
  }
}

interface Deps {
  db: Firestore
  auth: Auth
  notify: NotifyClient
  isOnline?: () => boolean
  now?: () => number
}

export function createStarRepository({
  db,
  auth,
  notify,
  isOnline = () => navigator.onLine,
  now = Date.now,
}: Deps): StarRepository {
  const me = () => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new SendFailed('failed')
    return uid
  }

  async function otherMember(uid: string): Promise<string> {
    const snap = await getDoc(doc(db, 'config/members'))
    const other = otherUidOf((snap.data()?.uids as string[] | undefined) ?? [], uid)
    if (!other) throw new SendFailed('failed')
    return other
  }

  /** After a timeout the first attempt may still have landed; that counts as sent. */
  async function alreadySent(id: string, uid: string): Promise<boolean> {
    try {
      const snap = await getDocFromServer(doc(db, 'stars', id))
      return snap.exists() && snap.data().fromUid === uid
    } catch {
      return false
    }
  }

  return {
    newDraftId: () => doc(collection(db, 'stars')).id,

    async send(draft) {
      if (!isOnline()) throw new SendFailed('offline')
      const uid = me()
      try {
        const toUid = await otherMember(uid)
        const hasPhoto = draft.photo !== null
        const batch = writeBatch(db)
        batch.set(doc(db, 'stars', draft.id), {
          fromUid: uid,
          toUid,
          text: draft.text,
          hasPhoto,
          createdAt: serverTimestamp(),
        })
        if (draft.photo) {
          batch.set(doc(db, 'starPhotos', draft.id), {
            fromUid: uid,
            toUid,
            data: Bytes.fromUint8Array(draft.photo),
          })
        }
        await withTimeout(batch.commit(), SEND_TIMEOUT_MS)
      } catch (err) {
        // A retry of a star that did land is refused as an "update": that is a success.
        const code = (err as { code?: string }).code
        if (code === 'permission-denied' && (await alreadySent(draft.id, uid))) {
          // fall through to notify below
        } else {
          throw err instanceof SendFailed ? err : new SendFailed(isOnline() ? 'failed' : 'offline')
        }
      }
      notify.send('star_new').catch(() => {})
    },

    watchWritten(cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      const q = query(
        collection(db, 'stars'),
        where('fromUid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(WRITTEN_LIMIT),
      )
      return onSnapshot(
        q,
        (snap) => cb(snap.docs.map((d) => toStar(d.id, d.data({ serverTimestamps: 'estimate' })))),
        () => cb([]),
      )
    },

    watchReceived(cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      const q = query(
        collection(db, 'stars'),
        where('toUid', '==', uid),
        orderBy('createdAt', 'asc'),
        limit(RECEIVED_LIMIT),
      )
      return onSnapshot(
        q,
        (snap) => cb(snap.docs.map((d) => toStar(d.id, d.data({ serverTimestamps: 'estimate' })))),
        () => cb([]),
      )
    },

    watchOpened(day, cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      let opened = new Set<string>()
      let doneToday = false
      let gotItems = false
      let gotDay = false
      const emit = () => {
        if (gotItems && gotDay) cb({ opened, doneToday })
      }
      const offItems = onSnapshot(
        collection(db, 'openedStars', uid, 'items'),
        (snap) => {
          opened = new Set(snap.docs.map((d) => d.id))
          gotItems = true
          emit()
        },
        () => {
          gotItems = true
          emit()
        },
      )
      const offDay = onSnapshot(
        doc(db, 'openedStars', uid, 'days', String(day)),
        (snap) => {
          doneToday = snap.exists()
          gotDay = true
          emit()
        },
        () => {
          gotDay = true
          emit()
        },
      )
      return () => {
        offItems()
        offDay()
      }
    },

    async openToday(star) {
      if (!isOnline()) throw new SendFailed('offline')
      const uid = me()
      // The phone's clock may be off; only the server's day is accepted, so
      // also try the neighbouring days. At most one can ever succeed.
      const phoneDay = myanmarDayNumber(now())
      for (const day of [phoneDay, phoneDay + 1, phoneDay - 1]) {
        const batch = writeBatch(db)
        batch.set(doc(db, 'openedStars', uid, 'items', star.id), { openedAt: serverTimestamp() })
        batch.set(doc(db, 'openedStars', uid, 'days', String(day)), { starId: star.id })
        try {
          await withTimeout(batch.commit(), SEND_TIMEOUT_MS)
          return 'opened'
        } catch (err) {
          if ((err as { code?: string }).code !== 'permission-denied') {
            throw err instanceof SendFailed ? err : new SendFailed(isOnline() ? 'failed' : 'offline')
          }
        }
      }
      return 'alreadyOpenedToday'
    },

    async loadPhoto(starId) {
      const snap = await getDoc(doc(db, 'starPhotos', starId))
      const data = snap.data()?.data as Bytes | undefined
      return data ? data.toUint8Array() : null
    },
  }
}
