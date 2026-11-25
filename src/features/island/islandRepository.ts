import type { Auth } from 'firebase/auth'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore'
import type { NotifyClient } from '../../core/notifyClient'
import { copy } from '../../copy/copy'
import { otherUidOf } from '../../core/members'
import { myanmarDayNumber, sulkFade } from '../../core/time'

export type LetterKind = 'snail' | 'bottle'
export type LetterBox = 'sent' | 'received'
export interface IslandLetter {
  id: string
  kind: LetterKind
  fromUid: string
  toUid: string
  text: string
  createdAt: Date | null
  opensAt: Date | null
  locked?: boolean
}
export interface GardenMemory { id: string; fromUid: string; text: string; createdAt: Date | null }
export type SulkLevel = 'cloudy' | 'rain' | 'storm'
export interface IslandSulk {
  id: string
  sulkerUid: string
  level: SulkLevel
  reason: string
  startedAt: Date | null
  endedAt: Date | null
  comfortCount: number
}
export interface SulkComfort { id: string; kind: 'hug' | 'note' | 'drops'; text: string; createdAt: Date | null }
export interface LanternState { day: number; litBy: string[] }
export type IslandDestination = 'noe' | 'khant' | 'shared'
export interface IslandVisit { visitedAt: Date | null; destination?: IslandDestination }

export interface IslandRepository {
  isNoe(): boolean
  myUid(): string
  watchLetters(kind: LetterKind, box: LetterBox, cb: (items: IslandLetter[]) => void): () => void
  writeLetter(kind: LetterKind, text: string, opensAt?: Date): Promise<void>
  watchGarden(cb: (items: GardenMemory[]) => void): () => void
  addMemory(text: string): Promise<void>
  deleteMemory(id: string): Promise<void>
  watchLantern(cb: (state: LanternState | null) => void): () => void
  lightLantern(): Promise<void>
  watchMyVisit(cb: (visit: IslandVisit | null) => void): () => void
  watchOtherVisit(cb: (visit: IslandVisit | null) => void): () => void
  chooseIsland(destination: IslandDestination): Promise<void>
  visitOtherIsland(): Promise<void>
  watchActiveSulks(cb: (items: IslandSulk[]) => void): () => void
  watchSulkHistory(cb: (items: IslandSulk[]) => void): () => void
  watchComforts(sulkId: string, cb: (items: SulkComfort[]) => void): () => void
  startSulk(level: SulkLevel, reason: string): Promise<void>
  comfortSulk(sulkId: string, kind: SulkComfort['kind'], text?: string): Promise<void>
  forgiveSulk(sulkId: string): Promise<void>
  deleteMyData(): Promise<void>
}

const dateOf = (value: unknown): Date | null => {
  const timestamp = value as FirestoreTimestamp | null | undefined
  return timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : null
}
const sulkFadeMs = sulkFade

function mapSulk(id: string, data: Record<string, unknown>): IslandSulk {
  return {
    id,
    sulkerUid: String(data.sulkerUid ?? ''),
    level: data.level === 'storm' || data.level === 'rain' ? data.level : 'cloudy',
    reason: String(data.reason ?? ''),
    startedAt: dateOf(data.startedAt),
    endedAt: dateOf(data.endedAt),
    comfortCount: Number(data.comfortCount ?? 0),
  }
}

function recordsFrom<T>(snap: { docs: QueryDocumentSnapshot[] }, map: (id: string, data: Record<string, unknown>) => T): T[] {
  return snap.docs.map((d) => map(d.id, d.data() as Record<string, unknown>))
}

export function createIslandRepository({ db, auth, now = Date.now, isOnline = () => navigator.onLine, notify }: {
  db: Firestore
  auth: Auth
  now?: () => number
  isOnline?: () => boolean
  notify?: NotifyClient
}): IslandRepository {
  const me = () => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error(copy.auth.needsReauth)
    return uid
  }
  const other = async (uid: string) => {
    const snap = await getDoc(doc(db, 'config/members'))
    const otherUid = otherUidOf((snap.data()?.uids as string[] | undefined) ?? [], uid)
    if (!otherUid || !(await getDoc(doc(db, 'profiles', otherUid))).exists()) throw new Error(copy.placesUi.partnerMissing)
    return otherUid
  }

  return {
    isNoe: () => auth.currentUser?.email?.split('@')[0].toLowerCase() === 'noe',
    myUid: () => auth.currentUser?.uid ?? '',
    watchLetters(kind, box, cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      const field = box === 'sent' ? 'fromUid' : 'toUid'
      const parts = [where(field, '==', uid), where('kind', '==', kind)]
      let version = 0
      return onSnapshot(query(collection(db, 'islandLetters'), ...parts, limit(100)), (snap) => {
        const current = ++version
        const rows = snap.docs.map((d) => { const data = d.data(); return { id: d.id, kind: data.kind as LetterKind, fromUid: String(data.fromUid), toUid: String(data.toUid), createdAt: dateOf(data.createdAt), opensAt: dateOf(data.opensAt) } })
        void Promise.all(rows.map(async (item) => {
          try {
            const body = await getDoc(doc(db, 'islandLetterBodies', item.id))
            return { ...item, text: String(body.data()?.text ?? ''), locked: false }
          } catch {
            return { ...item, text: '', locked: true }
          }
        })).then((withBodies) => {
          if (current !== version) return
          withBodies.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
          cb(withBodies)
        }).catch(() => cb([]))
      }, () => cb([]))
    },

    async writeLetter(kind, text, opensAt) {
      if (!isOnline()) throw new Error(copy.placesUi.letterOffline)
      const uid = me()
      const toUid = await other(uid)
      if ([...text.trim()].length === 0 || [...text].length > 1000) throw new Error(copy.placesUi.letterInvalid)
      if (kind === 'bottle' && (!opensAt || opensAt.getTime() <= now())) throw new Error(copy.placesUi.dateFuture)
      const id = doc(collection(db, 'islandLetters')).id
      const openTimestamp = kind === 'bottle' ? Timestamp.fromDate(opensAt!) : null
      const batch = writeBatch(db)
      batch.set(doc(db, 'islandLetters', id), { kind, fromUid: uid, toUid, opensAt: openTimestamp, createdAt: serverTimestamp() })
      batch.set(doc(db, 'islandLetterBodies', id), { kind, fromUid: uid, toUid, text: text.trim(), opensAt: openTimestamp, createdAt: serverTimestamp() })
      await batch.commit()
    },

    watchGarden(cb) {
      return onSnapshot(query(collection(db, 'gardenMemories'), orderBy('createdAt', 'desc'), limit(100)), (snap) => {
        cb(recordsFrom(snap, (id, data) => ({ id, fromUid: String(data.fromUid ?? ''), text: String(data.text ?? ''), createdAt: dateOf(data.createdAt) })))
      }, () => cb([]))
    },

    async addMemory(text) {
      const uid = me()
      if (!isOnline()) throw new Error(copy.placesUi.memoryOffline)
      if ([...text.trim()].length === 0 || [...text].length > 500) throw new Error(copy.placesUi.memoryTooLong)
      await addDoc(collection(db, 'gardenMemories'), { fromUid: uid, text: text.trim(), createdAt: serverTimestamp() })
    },

    async deleteMemory(id) { await deleteDoc(doc(db, 'gardenMemories', id)) },

    watchLantern(cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      return onSnapshot(doc(db, 'lanterns', 'today'), (snap) => {
        const data = snap.data()
        const day = Number(data?.day ?? -1)
        cb(day === myanmarDayNumber(now()) ? { day, litBy: (data?.litBy as string[] | undefined) ?? [] } : null)
      }, () => cb(null))
    },

    async lightLantern() {
      if (!isOnline()) throw new Error(copy.placesUi.sulkOffline)
      const uid = me()
      const day = myanmarDayNumber(now())
      const ref = doc(db, 'lanterns', 'today')
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        const data = snap.data()
        const litBy = Number(data?.day) === day ? (data?.litBy as string[] | undefined) ?? [] : []
        transaction.set(ref, { day, litBy: [...new Set([...litBy, uid])], updatedAt: serverTimestamp() })
      })
    },

    watchMyVisit(cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      return onSnapshot(doc(db, 'islandVisits', uid), (snap) => {
        cb(snap.exists() ? { visitedAt: dateOf(snap.data().visitedAt), destination: snap.data().destination } : null)
      }, () => cb(null))
    },

    watchOtherVisit(cb) {
      const uid = auth.currentUser?.uid
      if (!uid) return () => {}
      let off = () => {}
      let stopped = false
      void other(uid).then((otherUid) => {
        if (stopped) return
        off = onSnapshot(doc(db, 'islandVisits', otherUid), (snap) => {
          cb(snap.exists() ? { visitedAt: dateOf(snap.data().visitedAt), destination: snap.data().destination } : null)
        }, () => cb(null))
      }).catch(() => { if (!stopped) cb(null) })
      return () => { stopped = true; off() }
    },

    async chooseIsland(destination) {
      await setDoc(doc(db, 'islandVisits', me()), { destination, visitedAt: serverTimestamp() })
    },

    async visitOtherIsland() {
      const uid = me()
      await setDoc(doc(db, 'islandVisits', uid), { visitedAt: serverTimestamp() })
    },

    watchActiveSulks(cb) {
      return onSnapshot(query(collection(db, 'sulks'), where('startedAt', '>=', Timestamp.fromMillis(now() - sulkFadeMs)), limit(8)), (snap) => {
        const active = recordsFrom(snap, mapSulk).filter((s) => !s.endedAt && s.startedAt && now() - s.startedAt.getTime() < sulkFadeMs)
        cb(active)
      }, () => cb([]))
    },

    watchSulkHistory(cb) {
      return onSnapshot(query(collection(db, 'sulks'), orderBy('startedAt', 'desc'), limit(20)), (snap) => cb(recordsFrom(snap, mapSulk)), () => cb([]))
    },

    watchComforts(sulkId, cb) {
      return onSnapshot(query(collection(db, 'sulkComforts'), where('sulkId', '==', sulkId), limit(30)), (snap) => {
        const rows = snap.docs.map((d) => { const data = d.data(); return { id: d.id, kind: data.kind as SulkComfort['kind'], text: String(data.text ?? ''), createdAt: dateOf(data.createdAt) } })
        rows.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
        cb(rows)
      }, () => cb([]))
    },

    async startSulk(level, reason) {
      if (!isOnline()) throw new Error(copy.placesUi.sulkOffline)
      const uid = me()
      if ([...reason].length > 200) throw new Error(copy.placesUi.sulkReasonTooLong)
      const id = doc(collection(db, 'sulks')).id
      const batch = writeBatch(db)
      batch.set(doc(db, 'sulks', id), { sulkerUid: uid, level, reason: reason.trim(), startedAt: serverTimestamp(), endedAt: null, comfortCount: 0 })
      batch.set(doc(db, 'sulkPointers', uid), { activeSulkId: id, startedAt: serverTimestamp() })
      await batch.commit()
      void notify?.send('sulk_started')
    },

    async comfortSulk(sulkId, kind, text = '') {
      if (!isOnline()) throw new Error(copy.placesUi.sulkOffline)
      const uid = me()
      if ([...text].length > 200) throw new Error(copy.placesUi.comfortTooLong)
      const sulkRef = doc(db, 'sulks', sulkId)
      const comfortRef = doc(collection(db, 'sulkComforts'))
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(sulkRef)
        const data = snap.data()
        if (!data || data.sulkerUid === uid || data.endedAt || !dateOf(data.startedAt) || now() - dateOf(data.startedAt)!.getTime() >= sulkFadeMs) throw new Error(copy.placesUi.cloudGone)
        const count = Number(data.comfortCount ?? 0)
        transaction.update(sulkRef, { comfortCount: count + 1, lastComfortId: comfortRef.id })
        transaction.set(comfortRef, { comfortId: comfortRef.id, sulkId, fromUid: uid, toUid: String(data.sulkerUid), kind, text: text.trim(), createdAt: serverTimestamp() })
      })
      void notify?.send('sulk_comforted')
    },

    async forgiveSulk(sulkId) {
      const uid = me()
      const ref = doc(db, 'sulks', sulkId)
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        if (!snap.exists() || snap.data().sulkerUid !== uid) throw new Error(copy.placesUi.sulkOnlyOwner)
        transaction.update(ref, { endedAt: serverTimestamp() })
      })
      void notify?.send('sulk_forgiven')
    },

    async deleteMyData() {
      const uid = me()
      const allRefs = new Map<string, ReturnType<typeof doc>>()
      const photoIds = new Set<string>()
      const addSnap = (snap: { docs: QueryDocumentSnapshot[] }) => snap.docs.forEach((d) => { allRefs.set(d.ref.path, d.ref); if (d.ref.parent.id === 'stars' && d.data().hasPhoto === true) photoIds.add(d.id) })
      const fetch = async (q: Query) => addSnap(await getDocs(q))
      const col = (name: string) => collection(db, name)
      await Promise.all([
        fetch(query(col('stars'), where('fromUid', '==', uid))), fetch(query(col('stars'), where('toUid', '==', uid))),
        fetch(query(col('islandLetters'), where('fromUid', '==', uid))), fetch(query(col('islandLetters'), where('toUid', '==', uid))),
        fetch(query(col('gardenMemories'))), fetch(query(col('sulks'))), fetch(query(col('sulkComforts'))),
        fetch(query(col('treats'), where('fromUid', '==', uid))), fetch(query(col('treats'), where('toUid', '==', uid))),
        fetch(query(collection(db, 'openedStars', uid, 'items'))), fetch(query(collection(db, 'openedStars', uid, 'days'))),
      ])
      for (const id of photoIds) { const ref = doc(db, 'starPhotos', id); allRefs.set(ref.path, ref) }
      for (const ref of [...allRefs.values()]) {
        if (ref.path.startsWith('islandLetters/')) { const body = doc(db, 'islandLetterBodies', ref.id); allRefs.set(body.path, body) }
      }
      for (const path of [`feelings/${uid}`, `activities/${uid}`, `islandVisits/${uid}`, `profiles/${uid}`, `devices/${uid}`, `lanterns/today`, `sulkPointers/${uid}`]) {
        const ref = doc(db, path)
        allRefs.set(ref.path, ref)
      }
      const refs = [...allRefs.values()]
      for (let offset = 0; offset < refs.length; offset += 400) {
        const batch = writeBatch(db)
        refs.slice(offset, offset + 400).forEach((ref) => batch.delete(ref))
        await batch.commit()
      }
    },
  }
}
