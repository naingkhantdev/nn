// Install state: where the app is running and what to suggest.
// Pure functions take the user agent so they are easy to test.

export type InstallAdvice = 'installed' | 'inAppBrowser' | 'iosSafariAddToHome' | 'otherBrowser'

export interface IosVersion {
  major: number
  minor: number
}

export interface InstallEnv {
  userAgent: string
  standalone: boolean
  /** The link to copy when leaving an in-app browser. */
  url: string
}

const IOS = /iPhone|iPad|iPod/
// Facebook/Messenger, Instagram, LINE, Viber, WeChat, TikTok, Android WebView.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Viber|MicroMessenger|musical_ly|BytedanceWebview|; wv\)/
const IOS_OTHER_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS/

export function adviceFor({ userAgent, standalone }: { userAgent: string; standalone: boolean }): InstallAdvice {
  if (standalone) return 'installed'
  if (IN_APP.test(userAgent)) return 'inAppBrowser'
  if (IOS.test(userAgent)) {
    if (IOS_OTHER_BROWSER.test(userAgent)) return 'otherBrowser'
    // An iOS web view without the Safari token is some app's built-in browser.
    if (!/Safari\//.test(userAgent)) return 'inAppBrowser'
    return 'iosSafariAddToHome'
  }
  return 'otherBrowser'
}

export function parseIosVersion(userAgent: string): IosVersion | null {
  if (!IOS.test(userAgent)) return null
  const os = /OS (\d+)_(\d+)/.exec(userAgent)
  if (!os) return null
  let version = { major: Number(os[1]), minor: Number(os[2]) }
  // Safari 26+ freezes the OS token; its Version/ carries the real number.
  const safari = /Version\/(\d+)\.(\d+)/.exec(userAgent)
  if (safari) {
    const v = { major: Number(safari[1]), minor: Number(safari[2]) }
    if (v.major > version.major || (v.major === version.major && v.minor > version.minor)) version = v
  }
  return version
}

/** Web push on iPhone needs iOS 16.4+ and the Home Screen app. */
export function supportsWebPush(version: IosVersion | null): boolean {
  if (!version) return false
  return version.major > 16 || (version.major === 16 && version.minor >= 4)
}

export function readInstallEnv(): InstallEnv {
  const nav = navigator as Navigator & { standalone?: boolean }
  let standalone = nav.standalone === true
  try {
    standalone ||= window.matchMedia('(display-mode: standalone)').matches
  } catch {
    // matchMedia missing: treat as a normal tab.
  }
  return { userAgent: navigator.userAgent, standalone, url: `${window.location.origin}/` }
}

const GUIDE_SEEN_KEY = 'mochi.installGuideSeen'

export function hasSeenInstallGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markInstallGuideSeen(): void {
  try {
    localStorage.setItem(GUIDE_SEEN_KEY, '1')
  } catch {
    // Private mode or blocked storage: the guide just shows again next time.
  }
}
