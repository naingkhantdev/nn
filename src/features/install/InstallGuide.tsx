import { useRef, useState } from 'react'
import { copy } from '../../copy/copy'
import { supportsWebPush, type InstallAdvice, type IosVersion } from '../../platform/install'
import { Mochi } from '../mochi/Mochi'
import '../auth/auth.css'
import './install.css'

interface InstallGuideProps {
  advice: Extract<InstallAdvice, 'inAppBrowser' | 'iosSafariAddToHome'>
  iosVersion: IosVersion | null
  url: string
  onContinue: () => void
}

export function InstallGuide({ advice, iosVersion, url, onContinue }: InstallGuideProps) {
  return advice === 'inAppBrowser' ? (
    <InAppBrowserGuide url={url} />
  ) : (
    <AddToHomeGuide iosVersion={iosVersion} onContinue={onContinue} />
  )
}

function InAppBrowserGuide({ url }: { url: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const input = useRef<HTMLInputElement>(null)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch {
      // Some in-app browsers block the clipboard: select the text instead.
      input.current?.focus()
      input.current?.select()
      setStatus('failed')
    }
  }

  return (
    <div className="auth-screen">
      <Mochi expression="idle" size={110} />
      <div className="auth-card">
        <h1 className="auth-title">{copy.install.inAppTitle}</h1>
        <p className="auth-intro">{copy.install.inAppBody}</p>
        <ol className="install-steps">
          <li>
            <MenuIcon />
            <span>{copy.install.inAppStepMenu}</span>
          </li>
        </ol>
        <p className="auth-intro">{copy.install.orCopy}</p>
        <input
          ref={input}
          className="install-url"
          value={url}
          readOnly
          aria-label={copy.install.linkLabel}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button className="auth-button" type="button" onClick={() => void copyLink()}>
          {copy.install.copyLink}
        </button>
        {status !== 'idle' && (
          <p className="auth-message" role="status">
            {status === 'copied' ? copy.install.copied : copy.install.copyFailed}
          </p>
        )}
      </div>
    </div>
  )
}

function AddToHomeGuide({ iosVersion, onContinue }: { iosVersion: IosVersion | null; onContinue: () => void }) {
  const oldIos = iosVersion !== null && !supportsWebPush(iosVersion)
  return (
    <div className="auth-screen">
      <Mochi expression="happy" size={110} />
      <div className="auth-card">
        <h1 className="auth-title">{copy.install.addTitle}</h1>
        <p className="auth-intro">{copy.install.addBody}</p>
        <ol className="install-steps">
          <li>
            <ShareIcon />
            <span>{copy.install.stepShare}</span>
          </li>
          <li>
            <AddIcon />
            <span>{copy.install.stepAdd}</span>
          </li>
          <li>
            <Mochi expression="happy" size={34} />
            <span>{copy.install.stepOpen}</span>
          </li>
        </ol>
        {oldIos && <p className="install-note">{copy.install.oldIos}</p>}
      </div>
      <button className="auth-link-button" type="button" onClick={onContinue}>
        {copy.install.continueHere}
      </button>
    </div>
  )
}

const iconProps = {
  width: 34,
  height: 34,
  viewBox: '0 0 34 34',
  fill: 'none',
  stroke: 'var(--accent-ink)',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function ShareIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 13H9.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V15a2 2 0 0 0-2-2H22" />
      <path d="M17 21V4M11.5 9.5 17 4l5.5 5.5" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="5" width="24" height="24" rx="6" />
      <path d="M17 11v12M11 17h12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="17" r="1.6" fill="var(--accent-ink)" />
      <circle cx="17" cy="17" r="1.6" fill="var(--accent-ink)" />
      <circle cx="26" cy="17" r="1.6" fill="var(--accent-ink)" />
    </svg>
  )
}
