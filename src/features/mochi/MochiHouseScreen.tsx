import { useEffect, useState } from 'react'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import { BackToIsland } from '../island/BackToIsland'
import { Mochi } from './Mochi'
import { moodFor, readCare, recordCare, type Care } from './mochiMood'
import '../auth/auth.css'
import './house.css'

type Action = 'pet' | 'feed'

/** Re-render every so often so moods fade back by themselves. */
function useTick(ms: number) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

export function MochiHouseScreen() {
  const clock = useClock()
  const [care, setCare] = useState<Care>(readCare)
  const [last, setLast] = useState<{ action: Action; n: number } | null>(null)
  useTick(30_000)

  const now = clock()
  const mood = moodFor({ now, ...care })

  function act(action: Action) {
    const at = clock()
    recordCare(action, at)
    setCare((c) => (action === 'pet' ? { ...c, lastPetted: at } : { ...c, lastFed: at }))
    setLast((prev) => ({ action, n: (prev?.n ?? 0) + 1 }))
  }

  const said =
    last?.action === 'pet'
      ? copy.house.saidAfterPet
      : last?.action === 'feed'
        ? copy.house.saidAfterFeed
        : mood === 'sleepy'
          ? copy.house.saidSleepy
          : copy.house.saidHello

  return (
    <div className="auth-screen house-screen">
      <h1 className="auth-title">{copy.places.mochiHouse}</h1>

      <div className="house-room">
        {/* Tapping Mochi also pets it (the Pet button is the accessible way).
            The key restarts the squish animation on every tap. */}
        <div
          key={last ? `${last.action}-${last.n}` : 'still'}
          className={`house-mochi${last ? ' house-squish' : ''}`}
          onClick={() => act('pet')}
        >
          <Mochi expression={mood} size={190} />
        </div>

        {last?.action === 'pet' && (
          <div key={`hearts-${last.n}`} className="house-hearts" aria-hidden="true">
            <span>♥</span>
            <span>♥</span>
            <span>♥</span>
          </div>
        )}
        {last?.action === 'feed' && (
          <div key={`treat-${last.n}`} className="house-treat" aria-hidden="true">
            <svg viewBox="0 0 24 40" width="28" height="46">
              <line x1="12" y1="4" x2="12" y2="38" stroke="#b98a5e" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="10" r="6" fill="#f7a1a1" />
              <circle cx="12" cy="20" r="6" fill="var(--mochi)" stroke="var(--mochi-shade)" />
              <circle cx="12" cy="30" r="6" fill="var(--grass)" />
            </svg>
          </div>
        )}
      </div>

      <p className="house-said" aria-live="polite">
        {said}
      </p>

      <div className="house-actions">
        <button type="button" className="auth-button" onClick={() => act('pet')}>
          {copy.house.pet}
        </button>
        <button type="button" className="auth-button house-feed" onClick={() => act('feed')}>
          {copy.house.feed}
        </button>
      </div>

      <BackToIsland />
    </div>
  )
}
