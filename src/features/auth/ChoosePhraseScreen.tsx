import { useState, type FormEvent } from 'react'
import { copy } from '../../copy/copy'
import { Mochi } from '../mochi/Mochi'
import { toAuthFailure, validatePhrase } from './authRepository'
import './auth.css'

interface ChoosePhraseScreenProps {
  changePhrase: (newPhrase: string) => Promise<void>
  signOut: () => Promise<void>
}

/** First sign-in: she replaces the starter phrase so only she knows it. */
export function ChoosePhraseScreen({ changePhrase, signOut }: ChoosePhraseScreenProps) {
  const [phrase, setPhrase] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const problem = validatePhrase(phrase, repeat)
    if (problem) {
      setMessage(copy.auth[problem])
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      // On success the profile listener routes to the island.
      await changePhrase(phrase)
    } catch (err) {
      setMessage(copy.auth[toAuthFailure(err).kind])
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <Mochi expression="happy" size={110} />
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1 className="auth-title">{copy.auth.choosePhraseTitle}</h1>
        <p className="auth-intro">{copy.auth.choosePhraseIntro}</p>
        <label className="auth-field">
          {copy.auth.newPhraseLabel}
          <input
            type="password"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="auth-field">
          {copy.auth.repeatPhraseLabel}
          <input
            type="password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {message && (
          <p className="auth-message" role="alert">
            {message}
          </p>
        )}
        <button className="auth-button" type="submit" disabled={busy}>
          {copy.auth.save}
        </button>
        {busy && <p className="auth-intro">{copy.auth.saving}</p>}
      </form>
      <button className="auth-link-button" type="button" onClick={() => void signOut()}>
        {copy.auth.signOut}
      </button>
    </div>
  )
}
