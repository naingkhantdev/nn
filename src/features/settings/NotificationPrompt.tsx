import { useState } from 'react'
import { copy } from '../../copy/copy'
import type { PushService } from '../../platform/push'
import { Mochi } from '../mochi/Mochi'
import '../auth/auth.css'
import '../island/island.css'

// Asked once on this phone. After "not now" or a refusal it never comes back
// by itself; Settings has the switch.
const ASKED_KEY = 'mochi.push.asked'

function hasAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1'
  } catch {
    return false
  }
}

function markAsked(): void {
  try {
    localStorage.setItem(ASKED_KEY, '1')
  } catch {
    // Blocked storage: the offer may appear once more next time.
  }
}

/** True when the island should offer notifications right now. */
export function shouldOfferPush(push: PushService): boolean {
  return push.state() === 'off' && !hasAsked()
}

type Step = 'ask' | 'asking' | 'denied' | 'failed' | 'closed'

interface Props {
  push: PushService
  onClose?: () => void
}

/** Mochi explains first; the phone's permission dialog only follows a tap. */
export function NotificationPrompt({ push, onClose }: Props) {
  const [step, setStep] = useState<Step>(() =>
    shouldOfferPush(push) ? 'ask' : 'closed',
  )

  if (step === 'closed') return null

  const close = () => {
    markAsked()
    setStep('closed')
    onClose?.()
  }

  const enable = async () => {
    setStep('asking')
    try {
      const result = await push.enable()
      markAsked()
      if (result === 'denied') setStep('denied')
      else close()
    } catch {
      setStep('failed')
    }
  }

  const message =
    step === 'denied'
      ? copy.push.denied
      : step === 'failed'
        ? copy.push.failed
        : copy.push.body

  return (
    <div className="island-sheet-backdrop island-notification-backdrop">
      <div
        className="island-sheet"
        role="dialog"
        aria-labelledby="push-title"
      >
        <Mochi
          expression={step === 'denied' || step === 'failed' ? 'idle' : 'happy'}
          size={72}
        />
        <h2 id="push-title" className="auth-title">
          {copy.push.title}
        </h2>
        <p className="auth-intro">{message}</p>
        {step === 'ask' || step === 'asking' ? (
          <>
            <button
              type="button"
              className="auth-button"
              disabled={step === 'asking'}
              onClick={() => void enable()}
            >
              {step === 'asking' ? copy.push.asking : copy.push.yes}
            </button>
            <button
              type="button"
              className="auth-link-button"
              disabled={step === 'asking'}
              onClick={close}
            >
              {copy.push.notNow}
            </button>
          </>
        ) : (
          <button type="button" className="auth-button" onClick={close}>
            {copy.push.ok}
          </button>
        )}
      </div>
    </div>
  )
}
