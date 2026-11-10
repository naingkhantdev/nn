import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import { useServices } from '../../core/services'
import { Mochi } from '../mochi/Mochi'
import { compressPhoto as defaultCompress, PhotoFailed } from './photoCompress'
import { MAX_STAR_TEXT, checkStarText, starTextLength } from './star'
import { SendFailed } from './starRepository'
import '../auth/auth.css'
import './stars.css'

type Compress = (file: Blob, onProgress?: (fraction: number) => void) => Promise<Uint8Array>

function previewUrlFor(bytes: Uint8Array): string | null {
  try {
    return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }))
  } catch {
    return null
  }
}

export function WriteStarScreen({ compress = defaultCompress }: { compress?: Compress }) {
  const { stars } = useServices()
  const navigate = useNavigate()
  const [draftId, setDraftId] = useState(() => stars.newDraftId())
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<{ bytes: Uint8Array; url: string | null } | null>(null)
  const [shrinking, setShrinking] = useState<number | null>(null)
  const [status, setStatus] = useState<'editing' | 'sending' | 'failed' | 'sent'>('editing')
  const [message, setMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Free the preview image when it changes or the screen closes.
  useEffect(() => {
    const url = photo?.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [photo])

  const length = starTextLength(text)
  const busy = status === 'sending' || shrinking !== null

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // picking the same file again still fires
    if (!file) return
    setMessage(null)
    setShrinking(0)
    try {
      const bytes = await compress(file, (p) => setShrinking(p))
      setPhoto({ bytes, url: previewUrlFor(bytes) })
    } catch (err) {
      if (!(err instanceof PhotoFailed)) console.warn('photo', err)
      setMessage(copy.stars.photoFailed)
    } finally {
      setShrinking(null)
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const problem = checkStarText(text, photo !== null)
    if (problem) {
      setMessage(copy.stars[problem])
      return
    }
    setMessage(null)
    setStatus('sending')
    try {
      await stars.send({ id: draftId, text: text.trim(), photo: photo?.bytes ?? null })
      setStatus('sent')
    } catch (err) {
      const offline = err instanceof SendFailed && err.reason === 'offline'
      setMessage(offline ? copy.stars.offline : copy.stars.sendFailed)
      setStatus('failed') // text and photo stay; retry reuses the same draft id
    }
  }

  function writeAnother() {
    setDraftId(stars.newDraftId())
    setText('')
    setPhoto(null)
    setMessage(null)
    setStatus('editing')
  }

  if (status === 'sent') {
    return (
      <div className="auth-screen">
        <Mochi expression="happy" size={140} />
        <h1 className="auth-title">{copy.stars.sentTitle}</h1>
        <p className="auth-intro">{copy.stars.sentBody}</p>
        <button type="button" className="auth-button" onClick={writeAnother}>
          {copy.stars.writeAnother}
        </button>
        <button type="button" className="auth-link-button" onClick={() => navigate('/place/starJar')}>
          {copy.stars.backToJar}
        </button>
      </div>
    )
  }

  return (
    <form className="auth-screen star-write" onSubmit={send} noValidate>
      <h1 className="auth-title">{copy.stars.writeTitle}</h1>
      <p className="auth-intro">{copy.stars.writeHint}</p>

      <div className="auth-card star-paper">
        <label className="auth-field">
          {copy.stars.textLabel}
          <textarea
            className="star-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            disabled={status === 'sending'}
          />
        </label>
        <p className={`star-counter${length > MAX_STAR_TEXT ? ' star-counter-over' : ''}`} aria-live="polite">
          {length} / {MAX_STAR_TEXT}
        </p>

        {photo?.url && <img className="star-photo-preview" src={photo.url} alt={copy.stars.photoAlt} />}

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          data-testid="star-photo-input"
          onChange={(e) => void pickPhoto(e)}
        />
        <div className="star-photo-actions">
          <button type="button" className="auth-link-button" disabled={busy} onClick={() => fileInput.current?.click()}>
            {photo ? copy.stars.changePhoto : copy.stars.addPhoto}
          </button>
          {photo && (
            <button type="button" className="auth-link-button" disabled={busy} onClick={() => setPhoto(null)}>
              {copy.stars.removePhoto}
            </button>
          )}
        </div>

        {shrinking !== null && (
          <p className="auth-intro" role="status">
            {copy.stars.shrinkingPhoto} {Math.round(shrinking * 100)}%
          </p>
        )}
        {message && (
          <p className="auth-message" role="alert">
            {message}
          </p>
        )}

        <button type="submit" className="auth-button" disabled={busy}>
          {status === 'sending' ? copy.stars.sending : status === 'failed' ? copy.stars.retry : copy.stars.send}
        </button>
      </div>

      <button type="button" className="auth-link-button" onClick={() => navigate('/place/starJar')}>
        {copy.stars.backToJar}
      </button>
    </form>
  )
}
