import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  type Auth,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc, updateDoc, type Firestore } from 'firebase/firestore'

export const PRIVATE_DOMAIN = 'mochi-island.invalid'
export const MIN_PHRASE_LENGTH = 6

export interface SessionUser {
  uid: string
}

export interface Profile {
  phraseChosen: boolean
}

export type Unsubscribe = () => void

export interface AuthRepository {
  onSession(cb: (user: SessionUser | null) => void): Unsubscribe
  /** Calls back with null when the profile does not exist (yet). */
  watchProfile(uid: string, cb: (profile: Profile | null) => void): Unsubscribe
  signIn(username: string, phrase: string): Promise<void>
  changePhrase(newPhrase: string): Promise<void>
  reauthenticate(phrase: string): Promise<void>
  signOut(): Promise<void>
}

export type AuthFailureKind = 'wrongPhrase' | 'offline' | 'tooMany' | 'needsReauth' | 'unknown'

export class AuthFailure extends Error {
  readonly kind: AuthFailureKind
  constructor(kind: AuthFailureKind) {
    super(kind)
    this.name = 'AuthFailure'
    this.kind = kind
  }
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${PRIVATE_DOMAIN}`
}

const codeToKind: Record<string, AuthFailureKind> = {
  'auth/invalid-credential': 'wrongPhrase',
  'auth/invalid-login-credentials': 'wrongPhrase',
  'auth/wrong-password': 'wrongPhrase',
  'auth/user-not-found': 'wrongPhrase',
  'auth/invalid-email': 'wrongPhrase',
  'auth/missing-password': 'wrongPhrase',
  'auth/network-request-failed': 'offline',
  'auth/too-many-requests': 'tooMany',
  'auth/requires-recent-login': 'needsReauth',
}

export function toAuthFailure(err: unknown): AuthFailure {
  if (err instanceof AuthFailure) return err
  const code = (err as { code?: unknown } | null)?.code
  return new AuthFailure((typeof code === 'string' && codeToKind[code]) || 'unknown')
}

export type PhraseProblem = 'tooShort' | 'mismatch'

/** Length counts the trimmed phrase, so spaces alone cannot fill it. */
export function validatePhrase(phrase: string, repeat: string): PhraseProblem | null {
  if ([...phrase.trim()].length < MIN_PHRASE_LENGTH) return 'tooShort'
  if (phrase !== repeat) return 'mismatch'
  return null
}

export function createFirebaseAuthRepository(auth: Auth, db: Firestore): AuthRepository {
  const currentUser = () => {
    const user = auth.currentUser
    if (!user) throw new AuthFailure('needsReauth')
    return user
  }

  return {
    onSession: (cb) => onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid } : null)),

    watchProfile: (uid, cb) =>
      onSnapshot(
        doc(db, 'profiles', uid),
        (snap) => cb(snap.exists() ? { phraseChosen: snap.data().phraseChosen === true } : null),
        () => cb(null),
      ),

    async signIn(username, phrase) {
      try {
        await signInWithEmailAndPassword(auth, usernameToEmail(username), phrase)
      } catch (err) {
        throw toAuthFailure(err)
      }
    },

    async changePhrase(newPhrase) {
      const user = currentUser()
      try {
        await updatePassword(user, newPhrase)
        const ref = doc(db, 'profiles', user.uid)
        const existing = await getDoc(ref)
        if (existing.exists()) {
          await updateDoc(ref, { phraseChosen: true })
        } else {
          const displayName = (user.email ?? '').split('@')[0].slice(0, 40)
          await setDoc(ref, { displayName, phraseChosen: true })
        }
      } catch (err) {
        throw toAuthFailure(err)
      }
    },

    async reauthenticate(phrase) {
      const user = currentUser()
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', phrase))
      } catch (err) {
        throw toAuthFailure(err)
      }
    },

    signOut: () => firebaseSignOut(auth),
  }
}
