import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { IslandScreen } from '../island/IslandScreen'
import { PlaceScreen, SettingsScreen } from '../island/PlaceScreen'
import { Mochi } from '../mochi/Mochi'
import { KeepsakesScreen } from '../stars/KeepsakesScreen'
import { WriteStarScreen } from '../stars/WriteStarScreen'
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

const NO_FEATURES: Features = { sulkEnabled: false }
const noFeatures = () => NO_FEATURES

interface AppRoutesProps {
  repo: AuthRepository
  /** Hook that reads config/features; only listens while `enabled` (signed in). */
  useFeatures?: (enabled: boolean) => Features
}

/** Signed out goes to /login, phraseChosen !== true to /choose-phrase, otherwise the island. */
export function AppRoutes({ repo, useFeatures = noFeatures }: AppRoutesProps) {
  const session = useSession(repo)
  const target = targetFor(session)
  const features = useFeatures(session.status === 'signedIn' && session.phraseChosen)

  // Island routes (/, /place/:id, /settings) all share the '/' guard.
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
      <Route path="/" element={guard('/', <IslandScreen features={features} />)} />
      <Route path="/place/:id" element={guard('/', <PlaceScreen features={features} />)} />
      <Route path="/settings" element={guard('/', <SettingsScreen signOut={repo.signOut} deleteAccount={repo.deleteAccount} />)} />
      <Route path="/stars/write" element={guard('/', <WriteStarScreen />)} />
      <Route path="/stars/keepsakes" element={guard('/', <KeepsakesScreen />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
