import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-myanmar/400.css'
import '@fontsource/noto-sans-myanmar/700.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import './index.css'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { onAuthStateChanged } from 'firebase/auth'
import { app, auth, db } from './core/firebase'
import { useIslandConfig, type Features } from './core/members'
import { createNotifyClient } from './core/notifyClient'
import { ServicesProvider, type Services } from './core/services'
import { createFirebaseAuthRepository } from './features/auth/authRepository'
import { createFeelingRepository } from './features/feelings/feelingRepository'
import { compressPhoto } from './features/stars/photoCompress'
import { createStarRepository } from './features/stars/starRepository'
import { createFirebasePush } from './platform/firebasePush'
import { readInstallEnv } from './platform/install'
import { createE2eRepository, createE2eServices } from './testing/e2eRepo'

const NO_FEATURES: Features = { sulkEnabled: false }

function useFirebaseFeatures(enabled: boolean): Features {
  return useIslandConfig(db, enabled)?.features ?? NO_FEATURES
}

// Test-only signed-in session; the condition is false in production builds.
const e2e =
  import.meta.env.VITE_E2E === 'true' &&
  new URLSearchParams(location.search).has('e2e')
if (import.meta.env.VITE_E2E === 'true') {
  // Lets Playwright run the real photo compressor in WebKit.
  ;(window as unknown as { __mochiTest: unknown }).__mochiTest = {
    compressPhoto,
  }
}

const notify = createNotifyClient({
  url: import.meta.env.VITE_NOTIFY_URL as string | undefined,
  getIdToken: async () =>
    auth.currentUser ? auth.currentUser.getIdToken() : null,
})

const authRepository = e2e
  ? createE2eRepository()
  : createFirebaseAuthRepository(auth, db)
const services: Services = e2e
  ? createE2eServices()
  : {
      stars: createStarRepository({ db, auth, notify }),
      feelings: createFeelingRepository({ db, auth, notify }),
      push: createFirebasePush({
        app,
        auth,
        db,
        vapidKey: import.meta.env.VITE_FCM_VAPID_KEY as string | undefined,
      }),
    }

// Keep the push token fresh: re-save it whenever someone is signed in.
if (!e2e)
  onAuthStateChanged(auth, (user) => void (user && services.push.refresh()))
const installEnv = e2e
  ? { ...readInstallEnv(), standalone: true }
  : readInstallEnv()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ServicesProvider services={services}>
        <App
          repo={authRepository}
          installEnv={installEnv}
          useFeatures={e2e ? undefined : useFirebaseFeatures}
        />
      </ServicesProvider>
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
