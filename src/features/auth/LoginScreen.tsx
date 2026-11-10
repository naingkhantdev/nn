import { useState, type FormEvent } from 'react'
import { copy } from '../../copy/copy'
import { Mochi } from '../mochi/Mochi'
import { toAuthFailure } from './authRepository'
import './auth.css'

interface LoginScreenProps {
  signIn: (username: string, phrase: string) => Promise<void>
}

/** The only way in. No sign-up: exactly two accounts exist. */
export function LoginScreen({ signIn }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      await signIn(username, phrase)
    } catch (err) {
      setMessage(copy.auth[toAuthFailure(err).kind])
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <Mochi expression={message ? 'idle' : 'happy'} size={130} />
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1 className="auth-title">{copy.auth.welcome}</h1>
        <label className="auth-field">
          {copy.auth.usernameLabel}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </label>
        <label className="auth-field">
          {copy.auth.phraseLabel}
          <input
            type="password"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {message && (
          <p className="auth-message" role="alert">
            {message}
          </p>
        )}
        <button className="auth-button" type="submit" disabled={busy}>
          {copy.auth.signIn}
        </button>
        {busy && <p className="auth-intro">{copy.auth.signingIn}</p>}
      </form>
    </div>
  )
}
