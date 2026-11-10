import { useEffect, useState } from 'react'
import { doc, onSnapshot, type Firestore } from 'firebase/firestore'

export interface Features {
  sulkEnabled: boolean
}

export interface IslandConfig {
  members: string[]
  features: Features
}

/** Pure helper: the member who is not me, if any. */
export function otherUidOf(members: string[], me: string | null | undefined): string | null {
  if (!me) return null
  return members.find((m) => m !== me) ?? null
}

/** Listens to config/members and config/features. Two tiny docs, members only. */
export function useIslandConfig(db: Firestore, enabled: boolean): IslandConfig | null {
  const [members, setMembers] = useState<string[] | null>(null)
  const [features, setFeatures] = useState<Features>({ sulkEnabled: false })

  useEffect(() => {
    if (!enabled) return
    const offMembers = onSnapshot(
      doc(db, 'config/members'),
      (snap) => setMembers((snap.data()?.uids as string[] | undefined) ?? []),
      () => setMembers([]),
    )
    const offFeatures = onSnapshot(
      doc(db, 'config/features'),
      (snap) => setFeatures({ sulkEnabled: snap.data()?.sulk === true }),
      () => setFeatures({ sulkEnabled: false }),
    )
    return () => {
      offMembers()
      offFeatures()
    }
  }, [db, enabled])

  return members ? { members, features } : null
}
