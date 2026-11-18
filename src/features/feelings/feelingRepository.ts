import type { Auth } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore'
import { otherUidOf } from '../../core/members'
import type { NotifyClient } from '../../core/notifyClient'
import { isFeeling, isTreatKind, type Feeling, type FeelingDoc, type Treat, type TreatKind } from './feeling'

export interface FeelingRepository {
  watchMine(cb: (doc: FeelingDoc | null) => void): () => void
  watchOther(cb: (doc: FeelingDoc | null) => void): () => void
  /** Overwrites my one feeling doc. Sends no notification. */
  set(feeling: Feeling): void
  /** "Nothing right now": deletes my feeling doc. */
  clear(): void
  sendTreat(kind: TreatKind): Promise<void>
  /** Treats addressed to me, each shown once and then dismissed. */
  watchTreats(cb: (treats: Treat[]) => void): () => void
  dismissTreat(id: string): void
}

export class TreatFailed extends Error {
  constructor() {
    super('treat failed')
    this.name = 'TreatFailed'
  }
}

const TREAT_TIMEOUT_MS = 15_000

function toFeelingDoc(data: Record<string, unknown> | undefined): FeelingDoc | null {
  if (!data || !isFeeling(data.feeling)) return null
  const setAt = data.setAt as Timestamp | null | undefined
  return { feeling: data.feeling, setAt: setAt && typeof setAt.toDate === 'function' ? setAt.toDate() : null }
}

interface Deps {
  db: Firestore
  auth: Auth
  notify: NotifyClient
  isOnline?: () => boolean
}

export function createFeelingRepository({ db, auth, notify, isOnline = () => navigator.onLine }: Deps): FeelingRepository {
  const me = () => auth.currentUser?.uid ?? null

  async function otherUid(uid: string): Promise<string | null> {
    try {
      const snap = await getDoc(doc(db, 'config/members'))
      const other = otherUidOf((snap.data()?.uids as string[] | undefined) ?? [], uid)
      if (!other || !(await getDoc(doc(db, 'profiles', other))).exists()) return null
      return other
    } catch {
      return null
    }
  }

  const watchFeeling = (uid: string, cb: (d: FeelingDoc | null) => void) =>
    onSnapshot(
      doc(db, 'feelings', uid),
      (snap) => cb(toFeelingDoc(snap.data({ serverTimestamps: 'none' }))),
      () => cb(null),
    )

  return {
    watchMine(cb) {
      const uid = me()
      if (!uid) return () => {}
      return watchFeeling(uid, cb)
    },

    watchOther(cb) {
      const uid = me()
      if (!uid) return () => {}
      let off = () => {}
      let stopped = false
      void otherUid(uid).then((other) => {
        if (stopped || !other) return
        off = watchFeeling(other, cb)
      })
      return () => {
        stopped = true
        off()
      }
    },

    // Not awaited: the local cache updates at once and syncs when online.
    set(feeling) {
      const uid = me()
      if (!uid) return
      setDoc(doc(db, 'feelings', uid), { feeling, setAt: serverTimestamp() }).catch(() => {})
    },

    clear() {
      const uid = me()
      if (!uid) return
      deleteDoc(doc(db, 'feelings', uid)).catch(() => {})
    },

    async sendTreat(kind) {
      const uid = me()
      if (!uid || !isOnline()) throw new TreatFailed()
      const to = await otherUid(uid)
      if (!to) throw new TreatFailed()
      try {
        await Promise.race([
          addDoc(collection(db, 'treats'), { fromUid: uid, toUid: to, kind }),
          new Promise((_, reject) => setTimeout(() => reject(new TreatFailed()), TREAT_TIMEOUT_MS)),
        ])
      } catch {
        throw new TreatFailed()
      }
      notify.send('treat_sent').catch(() => {})
    },

    watchTreats(cb) {
      const uid = me()
      if (!uid) return () => {}
      return onSnapshot(
        query(collection(db, 'treats'), where('toUid', '==', uid)),
        (snap) =>
          cb(
            snap.docs.flatMap((d) => {
              const kind = d.data().kind
              return isTreatKind(kind) ? [{ id: d.id, kind }] : []
            }),
          ),
        () => cb([]),
      )
    },

    dismissTreat(id) {
      deleteDoc(doc(db, 'treats', id)).catch(() => {})
    },
  }
}
