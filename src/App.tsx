import { useState } from 'react'
import type { Features } from './core/members'
import type { AuthRepository } from './features/auth/authRepository'
import { AppRoutes } from './features/auth/AppRoutes'
import { InstallGuide } from './features/install/InstallGuide'
import {
  adviceFor,
  hasSeenInstallGuide,
  markInstallGuideSeen,
  parseIosVersion,
  type InstallEnv,
} from './platform/install'

interface AppProps {
  repo: AuthRepository
  installEnv: InstallEnv
  useFeatures?: (enabled: boolean) => Features
}

function App({ repo, installEnv, useFeatures }: AppProps) {
  const advice = adviceFor(installEnv)
  const [guideSeen, setGuideSeen] = useState(hasSeenInstallGuide)

  // In-app browsers always get the guide; Safari can choose to carry on.
  const guide =
    advice === 'inAppBrowser' || (advice === 'iosSafariAddToHome' && !guideSeen) ? advice : null

  return (
    <main data-testid="app-root" className="app-root">
      {guide ? (
        <InstallGuide
          advice={guide}
          iosVersion={parseIosVersion(installEnv.userAgent)}
          url={installEnv.url}
          onContinue={() => {
            markInstallGuideSeen()
            setGuideSeen(true)
          }}
        />
      ) : (
        <AppRoutes repo={repo} useFeatures={useFeatures} />
      )}
    </main>
  )
}

export default App
