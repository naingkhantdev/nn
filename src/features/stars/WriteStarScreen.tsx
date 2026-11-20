import { QuickNotes } from '../QuickNotes'
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

function StarNookArt({ landed = false }: { landed?: boolean }) {
  return (
    <svg className={landed ? 'star-nook-svg star-nook-landed' : 'star-nook-svg'} viewBox="0 0 380 390" role="presentation" aria-hidden="true">
      <path d="M42 334V113C42 51 89 22 153 22s111 29 111 91v221Z" fill="var(--sky)" stroke="var(--ink)" strokeWidth="5" />
      <path d="M59 326V115c0-50 37-76 94-76s94 26 94 76v211Z" fill="var(--sky-deep)" />
      <path d="M194 82a43 43 0 1 0 42 63 37 37 0 0 1-42-63Z" fill="var(--sun)" />
      <path d="M94 133 99 146 113 147 102 155 106 169 94 161 82 169 86 155 75 147 89 146Z" fill="var(--cloud)" />
      <path d="M187 177 191 187 202 188 194 195 197 206 187 200 177 206 180 195 172 188 183 187Z" fill="var(--cloud)" />
      <path d="M128 212c10-12 31-12 41 0 11-4 23 3 23 14H111c0-8 7-14 17-14Z" fill="var(--cloud)" />
      <path d="M30 320h268v21H30z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M80 341v28M249 341v28" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
      <path d="M112 304h104l-7 13h-91Z" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M130 298c-3-18 1-47 10-62 6-10 41-10 47 0 9 15 13 44 10 62Z" fill="var(--foam)" stroke="var(--ink)" strokeWidth="4" />
      <path d="M142 298c-2-18 2-40 8-51 4-6 22-6 27 0 6 11 10 33 8 51Z" fill="var(--sky)" opacity=".75" />
      <path className="star-nook-jar-star" d="m159 278 4 9 10 1-8 6 3 10-9-6-8 6 3-10-8-6 10-1Z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M147 231h39v9h-39z" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="4" />
      <path d="M239 296c16-9 23-7 38 2l-8 15h-35Z" fill="var(--leaf)" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M249 295c-8-17-5-30 5-40M261 300c3-20 13-28 26-30" fill="none" stroke="var(--grass-deep)" strokeWidth="5" strokeLinecap="round" />
      <path d="M275 270c7-3 12-2 16 2-4 7-10 10-18 9M251 260c-7-4-9-9-8-15 8 0 13 4 16 11" fill="var(--leaf)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
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
      const reason = err instanceof SendFailed ? err.reason : 'failed'
      setMessage(reason === 'offline' ? copy.stars.offline : reason === 'rules' ? copy.stars.rulesFailed : reason === 'setup' ? copy.stars.setupFailed : reason === 'partnerMissing' ? copy.stars.noPartner : copy.stars.sendFailed)
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
      <main className="star-write-layout star-write-success">
        <div className="star-write-scene"><StarNookArt landed /></div>
        <section className="star-write-main star-success-content">
          <Mochi expression="happy" size={116} />
          <h1 className="auth-title">{copy.stars.sentTitle}</h1>
          <p className="auth-intro">{copy.stars.sentBody}</p>
          <button type="button" className="auth-button" onClick={writeAnother}>{copy.stars.writeAnother}</button>
          <button type="button" className="auth-link-button" onClick={() => navigate('/place/starJar')}>{copy.stars.backToJar}</button>
        </section>
      </main>
    )
  }

  return (
    <form className="star-write-layout star-write" data-state={status} onSubmit={send} noValidate>
      <div className="star-write-scene"><StarNookArt /></div>
      <div className="star-write-main">
      <h1 className="auth-title">{copy.stars.writeTitle}</h1>
      <p className="auth-intro">{copy.stars.writeHint}</p>

      <div className="auth-card star-paper">
      {!text && <QuickNotes choose={setText} />}
        <label className="auth-field">
          {copy.stars.textLabel}
          <textarea
            className="star-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
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

      <button type="button" className="auth-link-button star-write-back" onClick={() => navigate('/place/starJar')}>
        {copy.stars.backToJar}
      </button>
      </div>
    </form>
  )
}
