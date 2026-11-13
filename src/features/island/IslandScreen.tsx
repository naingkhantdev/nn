import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import type { Features } from '../../core/members'
import { useServices } from '../../core/services'
import {
  activeFeeling,
  expressionFor,
  type FeelingDoc,
  type Treat,
} from '../feelings/feeling'
import { useMinuteTick } from '../feelings/useMinuteTick'
import { Mochi } from '../mochi/Mochi'
import { moodFor, readCare } from '../mochi/mochiMood'
import {
  NotificationPrompt,
  shouldOfferPush,
} from '../settings/NotificationPrompt'
import { IslandScene } from './IslandScene'
import {
  PLACE_TAP_SIZE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  islandPlaces,
  isOpen,
} from './places'
import { useCurrentWeather } from './weather'
import '../auth/auth.css'
import '../feelings/feelings.css'
import './island.css'

/** False while the app is hidden, so animations stop and save battery. */
function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => document.visibilityState !== 'hidden',
  )
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`

export function IslandScreen({ features }: { features: Features }) {
  const navigate = useNavigate()
  const weather = useCurrentWeather()
  const visible = usePageVisible()
  const [stillBuilding, setStillBuilding] = useState(false)
  const { feelings, push } = useServices()
  const [offeringPush, setOfferingPush] = useState(() => shouldOfferPush(push))
  const [mine, setMine] = useState<FeelingDoc | null>(null)
  const [other, setOther] = useState<FeelingDoc | null>(null)
  const [treats, setTreats] = useState<Treat[]>([])
  useEffect(() => feelings.watchMine(setMine), [feelings])
  useEffect(() => feelings.watchOther(setOther), [feelings])
  useEffect(() => feelings.watchTreats(setTreats), [feelings])
  useMinuteTick()

  const now = useClock()()
  const myFeeling = activeFeeling(mine, now)
  const theirFeeling = activeFeeling(other, now)
  // My own Mochi shows my feeling; otherwise its own gentle local mood.
  const mood = myFeeling
    ? expressionFor(myFeeling)
    : moodFor({ now, ...readCare() })
  const treat = treats[0] ?? null
  const feelingsPlace = islandPlaces.find((p) => p.id === 'feelings')!

  return (
    <div className={`island-screen${visible ? '' : ' island-paused'}`}>
      <div className="island-frame">
        <IslandScene weather={weather} />

        <div
          className="island-mochi"
          style={{ left: pct(214, SCENE_WIDTH), top: pct(352, SCENE_HEIGHT) }}
          aria-hidden="true"
        >
          <Mochi expression={mood} size={40} />
        </div>

        {theirFeeling && (
          <div
            className="feeling-bubble"
            role="img"
            aria-label={`${copy.feelings.bubblePrefix} ${copy.feelings.label[theirFeeling].toLowerCase()}`}
            style={{
              left: pct(feelingsPlace.x, SCENE_WIDTH),
              top: pct(feelingsPlace.y - 28, SCENE_HEIGHT),
            }}
          >
            <Mochi expression={expressionFor(theirFeeling)} size={36} />
          </div>
        )}

        {islandPlaces.map((place) => (
          <button
            key={place.id}
            type="button"
            className="island-place"
            aria-label={copy.places[place.id]}
            style={{
              left: pct(place.x, SCENE_WIDTH),
              top: pct(place.y, SCENE_HEIGHT),
              width: `${PLACE_TAP_SIZE}px`,
              height: `${PLACE_TAP_SIZE}px`,
            }}
            onClick={() =>
              isOpen(place.id, features)
                ? navigate(`/place/${place.id}`)
                : setStillBuilding(true)
            }
          />
        ))}
      </div>

      <button
        type="button"
        className="island-settings"
        aria-label={copy.island.settings}
        onClick={() => navigate('/settings')}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-.1-1.2 2-1.6-2-3.4-2.4.9a8 8 0 0 0-2-1.2L15 3h-4l-.5 2.5a8 8 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6L6 12l.1 1.2-2 1.6 2 3.4 2.4-.9a8 8 0 0 0 2 1.2L11 21h4l.5-2.5a8 8 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6.1-1.2Z"
            fill="var(--mochi)"
            stroke="var(--ink)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {offeringPush && (
        <NotificationPrompt
          push={push}
          onClose={() => setOfferingPush(false)}
        />
      )}

      {treat && !stillBuilding && !offeringPush && (
        <div className="island-sheet-backdrop">
          <div
            className="island-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="treat-title"
          >
            <Mochi expression="happy" size={72} />
            <h2 id="treat-title" className="auth-title">
              {copy.treats.arrivedTitle}
            </h2>
            <p className="auth-intro">{copy.treats.arrived[treat.kind]}</p>
            <button
              type="button"
              className="auth-button"
              onClick={() => {
                // Seen once: delete it, and hide it right away.
                feelings.dismissTreat(treat.id)
                setTreats((list) => list.filter((t) => t.id !== treat.id))
              }}
            >
              {copy.treats.thanks}
            </button>
          </div>
        </div>
      )}

      {stillBuilding && (
        <div
          className="island-sheet-backdrop"
          onClick={() => setStillBuilding(false)}
        >
          <div
            className="island-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="still-building-title"
            onClick={(e) => e.stopPropagation()}
          >
            <Mochi expression="happy" size={72} />
            <h2 id="still-building-title" className="auth-title">
              {copy.island.stillBuildingTitle}
            </h2>
            <p className="auth-intro">{copy.island.stillBuildingBody}</p>
            <button
              type="button"
              className="auth-button"
              onClick={() => setStillBuilding(false)}
            >
              {copy.island.stillBuildingOk}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
