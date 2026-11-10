import { useEffect, useState } from 'react'
import { copy } from '../../copy/copy'
import { useServices } from '../../core/services'
import type { Star } from './star'

/** Loads a star's photo bytes on demand and shows them. */
export function StarPhoto({ starId }: { starId: string }) {
  const { stars } = useServices()
  const [state, setState] = useState<{ url: string } | 'loading' | 'missing'>('loading')

  useEffect(() => {
    let url: string | null = null
    let alive = true
    stars
      .loadPhoto(starId)
      .then((bytes) => {
        if (!alive) return
        if (!bytes) return setState('missing')
        try {
          url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }))
          setState({ url })
        } catch {
          setState('missing')
        }
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [stars, starId])

  if (state === 'loading') return <p className="auth-intro">{copy.stars.photoLoading}</p>
  if (state === 'missing') return <p className="auth-intro">{copy.stars.photoMissing}</p>
  return <img className="star-photo-preview" src={state.url} alt={copy.stars.photoAlt} />
}

/** A star falls, unfolds, and shows its message. */
export function StarUnfold({ star, onClose }: { star: Star; onClose: () => void }) {
  return (
    <div className="unfold-backdrop">
      <div className="unfold-card" role="dialog" aria-modal="true" aria-label={copy.places.starJar}>
        <svg className="unfold-star" viewBox="-12 -12 24 24" width="56" height="56" aria-hidden="true">
          <path d="M0 -10 L2.9 -3.1 10 -3.1 4.3 1.3 6.5 9 0 4.5 -6.5 9 -4.3 1.3 -10 -3.1 -2.9 -3.1 Z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        <div className="unfold-paper">
          {star.text && <p className="unfold-text">{star.text}</p>}
          {star.hasPhoto && <StarPhoto starId={star.id} />}
        </div>
        <button type="button" className="auth-button" onClick={onClose}>
          {copy.stars.keepIt}
        </button>
      </div>
    </div>
  )
}
