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
import { createFirebaseAuthRepository } from './features/auth/authRepository'
import { readInstallEnv } from './platform/install'

const authRepository = createFirebaseAuthRepository(auth, db)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App repo={authRepository} installEnv={readInstallEnv()} />
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
