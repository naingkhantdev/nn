import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { copy } from '../../copy/copy'
import { Mochi } from '../mochi/Mochi'
import type { AuthRepository } from './authRepository'
import { ChoosePhraseScreen } from './ChoosePhraseScreen'
import { LoginScreen } from './LoginScreen'
import './auth.css'

type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; uid: string; phraseChosen: boolean }

type Path = '/login' | '/choose-phrase' | '/'

function useSession(repo: AuthRepository): Session {
  // undefined = not known yet; null = signed out.
  const [uid, setUid] = useState<string | null | undefined>(undefined)
  const [profile, setProfile] = useState<{ uid: string; phraseChosen: boolean } | null>(null)

  useEffect(() => repo.onSession((u) => setUid(u?.uid ?? null)), [repo])

  useEffect(() => {
    if (!uid) return
    return repo.watchProfile(uid, (p) => setProfile({ uid, phraseChosen: p?.phraseChosen === true }))
  }, [repo, uid])

  if (uid === undefined) return { status: 'loading' }
  if (uid === null) return { status: 'signedOut' }
  if (profile?.uid !== uid) return { status: 'loading' }
  return { status: 'signedIn', uid, phraseChosen: profile.phraseChosen }
}

function targetFor(session: Session): Path | null {
  switch (session.status) {
    case 'loading':
      return null
    case 'signedOut':
      return '/login'
    case 'signedIn':
      return session.phraseChosen ? '/' : '/choose-phrase'
  }
}

export function LoadingScreen() {
  return (
    <div className="auth-screen">
      <Mochi expression="sleepy" size={150} />
      <p className="auth-intro">{copy.loading}</p>
    </div>
  )
}

/** Placeholder home until Task 8 builds the island. */
function IslandPlaceholder({ signOut }: { signOut: () => Promise<void> }) {
  return (
    <div className="auth-screen">
      <Mochi expression="happy" size={180} />
      <h1 className="auth-title">{copy.appName}</h1>
      <p className="auth-intro">{copy.island.comingSoon}</p>
      <button className="auth-link-button" type="button" onClick={() => void signOut()}>
        {copy.auth.signOut}
      </button>
    </div>
  )
}

/** Signed out goes to /login, phraseChosen !== true to /choose-phrase, otherwise /. */
export function AppRoutes({ repo }: { repo: AuthRepository }) {
  const target = targetFor(useSession(repo))

  const guard = (here: Path, screen: ReactNode) => {
    if (target === null) return <LoadingScreen />
    if (target !== here) return <Navigate to={target} replace />
    return screen
  }

  return (
    <Routes>
      <Route path="/login" element={guard('/login', <LoginScreen signIn={repo.signIn} />)} />
      <Route
        path="/choose-phrase"
        element={guard(
          '/choose-phrase',
          <ChoosePhraseScreen changePhrase={repo.changePhrase} signOut={repo.signOut} />,
        )}
      />
      <Route path="/" element={guard('/', <IslandPlaceholder signOut={repo.signOut} />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
