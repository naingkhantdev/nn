import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import type { Features } from '../../core/members'
import { useServices } from '../../core/services'
import {
  activeActivity,
  activeFeeling,
  expressionFor,
  expressionForActivity,
  type ActivityDoc,
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
import { PlayfulMochi } from './PlayfulMochi'
import { IslandScene, IslandWideScene } from './IslandScene'
import { WaterPlay } from './WaterPlay'
import { usePageVisible } from './usePageVisible'
import {
  PLACE_TAP_SIZE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  islandPlaces,
  isOpen,
} from './places'
import { weatherForSulks } from './weather'
import { formatVisitAge } from './visitTime'
import type { IslandVisit, IslandSulk } from './islandRepository'
import '../auth/auth.css'
import '../feelings/feelings.css'
import './island.css'

const pct = (value: number, total: number) => `${(value / total) * 100}%`

export function IslandScreen({ features }: { features: Features }) {
  const navigate = useNavigate()
  const [activeSulks, setActiveSulks] = useState<IslandSulk[]>([])
  const weather = weatherForSulks(features.sulkEnabled ? activeSulks : [], useClock()())
  const visible = usePageVisible()
  const [stillBuilding, setStillBuilding] = useState(false)
  const { feelings, push, island } = useServices()
  const [offeringPush, setOfferingPush] = useState(() => shouldOfferPush(push))
  const [mine, setMine] = useState<FeelingDoc | null>(null)
  const [other, setOther] = useState<FeelingDoc | null>(null)
  const [myActivity, setMyActivity] = useState<ActivityDoc | null>(null)
  const [friendActivity, setFriendActivity] = useState<ActivityDoc | null>(null)
  const [myVisit, setMyVisit] = useState<IslandVisit | null>(null)
  const [friendVisit, setFriendVisit] = useState<IslandVisit | null>(null)
  const [treats, setTreats] = useState<Treat[]>([])
  useEffect(() => {
    if (!features.sulkEnabled) return
    return island.watchActiveSulks(setActiveSulks)
  }, [island, features.sulkEnabled])
  useEffect(() => feelings.watchMine(setMine), [feelings])
  useEffect(() => feelings.watchOther(setOther), [feelings])
  useEffect(() => feelings.watchMyActivity(setMyActivity), [feelings])
  useEffect(() => feelings.watchOtherActivity(setFriendActivity), [feelings])
  useEffect(() => island.watchMyVisit(setMyVisit), [island])
  useEffect(() => island.watchOtherVisit(setFriendVisit), [island])
  useEffect(() => feelings.watchTreats(setTreats), [feelings])
  const [travelFailed, setTravelFailed] = useState(false)
  useEffect(() => { void island.chooseIsland('shared').catch(() => setTravelFailed(true)) }, [island])
  useMinuteTick()

  const now = useClock()()
  const myFeeling = activeFeeling(mine, now)
  const theirFeeling = activeFeeling(other, now)
  const myCurrentActivity = activeActivity(myActivity, now)
  const friendCurrentActivity = activeActivity(friendActivity, now)
  // My own Mochi shows my feeling; otherwise its own gentle local mood.
  const mood = myFeeling
    ? expressionFor(myFeeling)
    : myCurrentActivity
      ? expressionForActivity(myCurrentActivity)
      : moodFor({ now, ...readCare() })
  const friendExpression = theirFeeling
    ? expressionFor(theirFeeling)
    : friendCurrentActivity
      ? expressionForActivity(friendCurrentActivity)
      : 'idle'
  const treat = treats[0] ?? null
  return (
    <div className={`island-screen${visible ? '' : ' island-paused'}`}>
      <div className="island-frame">
        {travelFailed && <p role="status">{copy.island.visitOffline}</p>}
        <IslandScene weather={weather} />
        <IslandWideScene weather={weather} />
        <WaterPlay />


        {(friendVisit?.visitedAt || myVisit?.visitedAt) && (
          <details className="island-visit-history">
            <summary aria-label={copy.island.visitHistory} title={copy.island.visitHistory}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 10a9 9 0 1 1 1.5 7M3 5v5h5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </summary>
            <div className="island-visit-history-content">
              {friendVisit?.visitedAt && <p>{copy.island.friendLastVisit(formatVisitAge(friendVisit.visitedAt, now))}</p>}
              {myVisit?.visitedAt && <p>{copy.island.myLastVisit(formatVisitAge(myVisit.visitedAt, now))}</p>}
            </div>
          </details>
        )}
        <div
          className="island-mochi island-mochi-you"
          style={{ left: pct(185, SCENE_WIDTH), top: pct(352, SCENE_HEIGHT) }}
        >
          <PlayfulMochi together={friendVisit?.destination === 'shared'}
            bow={island.isNoe()}
            expression={mood}
            size={40}
            label={myCurrentActivity
              ? copy.island.yourActivity(copy.activities.label[myCurrentActivity].toLowerCase())
              : copy.island.youMochi}
          />
          <span className="island-mochi-name" aria-hidden="true">{island.isNoe() ? copy.island.noe : copy.island.khant}</span>
          {myCurrentActivity && <span className="island-mochi-activity" aria-hidden="true">{copy.activities.label[myCurrentActivity]}</span>}
        </div>
        {(friendVisit?.destination === 'shared') && <div
          className={`island-mochi island-mochi-friend${island.isNoe() ? "" : " island-mochi-noe"}`}
          style={{ left: pct(282, SCENE_WIDTH), top: pct(365, SCENE_HEIGHT) }}
        >
          <Mochi
            bow={!island.isNoe()}
            expression={friendExpression}
            size={40}
            label={friendCurrentActivity
              ? copy.island.friendActivity(copy.activities.label[friendCurrentActivity].toLowerCase())
              : theirFeeling
                ? copy.island.friendFeeling(copy.feelings.label[theirFeeling].toLowerCase())
                : copy.island.friendMochi}
          />
          <span className="island-mochi-name" aria-hidden="true">{island.isNoe() ? copy.island.khant : copy.island.noe}</span>
          {friendCurrentActivity && <span className="island-mochi-activity" aria-hidden="true">{copy.activities.label[friendCurrentActivity]}</span>}
        </div>}

        <button
          type="button"
          className={`shared-destination shared-destination-${island.isNoe() ? 'khant' : 'noe'}`}
          aria-label={copy.islandName(island.isNoe() ? copy.island.khant : copy.island.noe)}
          onClick={() => navigate('/visit', { state: { sailing: true } })}
        />
        <button
          type="button"
          className={`shared-destination shared-destination-${island.isNoe() ? 'noe' : 'khant'}`}
          aria-label={copy.islandName(island.isNoe() ? copy.island.noe : copy.island.khant)}
          onClick={() => navigate('/', { state: { sailing: true } })}
        />
        {islandPlaces.map((place) => (
          <button
            key={place.id}
            type="button"
            className={`island-place island-place-${place.id}`}
            aria-label={copy.places[place.id]}
            style={{
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
