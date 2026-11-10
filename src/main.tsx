import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-myanmar/400.css'
import '@fontsource/noto-sans-myanmar/700.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import './index.css'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { auth, db } from './core/firebase'
import { useIslandConfig, type Features } from './core/members'
import { createFirebaseAuthRepository } from './features/auth/authRepository'
import { readInstallEnv } from './platform/install'
import { createE2eRepository } from './testing/e2eRepo'

const NO_FEATURES: Features = { sulkEnabled: false }

function useFirebaseFeatures(enabled: boolean): Features {
  return useIslandConfig(db, enabled)?.features ?? NO_FEATURES
}

// Test-only signed-in session; the condition is false in production builds.
const e2e = import.meta.env.VITE_E2E === 'true' && new URLSearchParams(location.search).has('e2e')

const authRepository = e2e ? createE2eRepository() : createFirebaseAuthRepository(auth, db)
const installEnv = e2e ? { ...readInstallEnv(), standalone: true } : readInstallEnv()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App
        repo={authRepository}
        installEnv={installEnv}
        useFeatures={e2e ? undefined : useFirebaseFeatures}
      />
    </BrowserRouter>
  </StrictMode>,
)

// Fade out the instant HTML loader once React has painted.
requestAnimationFrame(() => {
  const loader = document.getElementById('loader')
  if (!loader) return
  loader.classList.add('gone')
  setTimeout(() => loader.remove(), 400)
})
