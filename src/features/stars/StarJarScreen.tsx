import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import { useServices } from '../../core/services'
import { myanmarDayNumber } from '../../core/time'
import { createShakeDetector, type ShakeDetector } from '../../platform/shake'
import { BackToIsland } from '../island/BackToIsland'
import { jarStateFor } from './jarState'
import type { Star } from './star'
import { SendFailed, type OpenedState } from './starRepository'
import { StarUnfold } from './StarUnfold'
import '../auth/auth.css'
import './stars.css'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

/** Today's Myanmar day, re-checked every minute so the jar resets at midnight. */
function useMyanmarDay(): number {
  const clock = useClock()
  const [day, setDay] = useState(() => myanmarDayNumber(clock()))
  useEffect(() => {
    const id = setInterval(() => setDay(myanmarDayNumber(clock())), 60_000)
    return () => clearInterval(id)
  }, [clock])
  return day
}

function JarArt({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 120 140" width="150" height="175" aria-hidden="true">
      <ellipse cx="60" cy="132" rx="44" ry="6" fill="var(--shadow)" />
      <rect x="34" y="6" width="52" height="16" rx="5" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
      <path
        d="M30 24 H90 Q104 24 104 40 V112 Q104 128 88 128 H32 Q16 128 16 112 V40 Q16 24 30 24 Z"
        fill="var(--foam)"
        stroke="var(--ink)"
        strokeWidth="3.5"
      />
      {full &&
        [
          [40, 104],
          [62, 112],
          [82, 100],
          [52, 86],
          [74, 80],
        ].map(([x, y], i) => (
          <path
            key={i}
            transform={`translate(${x} ${y})`}
            d="M0 -9 L2.6 -2.8 9 -2.8 3.8 1.2 5.8 8 0 4 -5.8 8 -3.8 1.2 -9 -2.8 -2.6 -2.8 Z"
            fill="var(--sun)"
            stroke="var(--ink)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ))}
      <path d="M28 40 Q26 70 30 100" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

export function StarJarScreen({ shake: shakeProp }: { shake?: ShakeDetector }) {
  const { stars } = useServices()
  const navigate = useNavigate()
  const day = useMyanmarDay()
  const shake = useMemo(() => shakeProp ?? createShakeDetector(), [shakeProp])

  const [written, setWritten] = useState<Star[] | null>(null)
  const [received, setReceived] = useState<Star[] | null>(null)
  const [openedState, setOpenedState] = useState<OpenedState | null>(null)
  const [unfolded, setUnfolded] = useState<Star | null>(null)
  const [opening, setOpening] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [shakeOn, setShakeOn] = useState(false)

  useEffect(() => stars.watchWritten(setWritten), [stars])
  useEffect(() => stars.watchReceived(setReceived), [stars])
  useEffect(() => stars.watchOpened(day, setOpenedState), [stars, day])

  const jar =
    received && openedState ? jarStateFor(received, openedState.opened, openedState.doneToday) : null

  async function openJar() {
    if (opening || jar?.kind !== 'ready') return
    setOpening(true)
    setNote(null)
    try {
      const result = await stars.openToday(jar.next)
      if (result === 'opened') setUnfolded(jar.next)
      else setNote(copy.stars.comeBackTomorrow)
    } catch (err) {
      const offline = err instanceof SendFailed && err.reason === 'offline'
      setNote(offline ? copy.stars.offline : copy.stars.openFailed)
    } finally {
      setOpening(false)
    }
  }

  // Shake only listens after she turns it on with a tap.
  useEffect(() => {
    if (!shakeOn) return
    return shake.onShake(() => void openJar())
  })

  async function turnOnShake() {
    const granted = await shake.requestPermission()
    if (granted) setShakeOn(true)
    else setNote(copy.stars.shakeDenied)
  }

  const status =
    jar === null
      ? null
      : jar.kind === 'ready'
        ? shakeOn
          ? copy.stars.jarReadyShake
          : copy.stars.jarReady
        : jar.kind === 'doneToday'
          ? copy.stars.jarDoneToday
          : copy.stars.jarEmpty

  return (
    <div className="auth-screen star-jar">
      <h1 className="auth-title">{copy.places.starJar}</h1>

      <button
        type="button"
        className={`jar-button${jar?.kind === 'ready' ? ' jar-ready' : ''}${opening ? ' jar-opening' : ''}`}
        aria-label={copy.stars.jarLabel}
        aria-disabled={jar?.kind !== 'ready'}
        onClick={() => void openJar()}
      >
        <JarArt full={jar?.kind === 'ready'} />
      </button>

      {opening && <p className="auth-intro">{copy.stars.opening}</p>}
      {!opening && status && <p className="auth-intro">{status}</p>}
      {note && (
        <p className="auth-message" role="status">
          {note}
        </p>
      )}

      <div className="jar-actions">
        {jar?.kind === 'ready' && shake.supported && !shakeOn && (
          <button type="button" className="auth-link-button" onClick={() => void turnOnShake()}>
            {copy.stars.shakeMode}
          </button>
        )}
        <button type="button" className="auth-link-button" onClick={() => navigate('/stars/keepsakes')}>
          {copy.stars.keepsakes}
        </button>
      </div>

      <button type="button" className="auth-button" onClick={() => navigate('/stars/write')}>
        {copy.stars.writeStar}
      </button>

      <section className="auth-card" aria-labelledby="written-title">
        <h2 id="written-title" className="star-section-title">
          {copy.stars.writtenTitle}
        </h2>
        <p className="auth-intro star-small">{copy.stars.writtenNote}</p>
        {written !== null && written.length === 0 && <p className="auth-intro">{copy.stars.writtenEmpty}</p>}
        {written && written.length > 0 && (
          <ul className="star-list">
            {written.map((s) => (
              <li key={s.id} className="star-list-item">
                <span className="star-list-text">{s.text || copy.stars.withPhoto}</span>
                <span className="star-list-meta">
                  {s.createdAt ? dateFormat.format(s.createdAt) : copy.stars.justNow}
                  {s.hasPhoto && s.text ? ` · ${copy.stars.withPhoto}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BackToIsland />

      {unfolded && <StarUnfold star={unfolded} onClose={() => setUnfolded(null)} />}
    </div>
  )
}
