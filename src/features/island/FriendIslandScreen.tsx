import { BoatArt } from './BoatArt'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import { useServices } from '../../core/services'
import {
  activeActivity,
  activeFeeling,
  expressionFor,
  expressionForActivity,
  type ActivityDoc,
  type FeelingDoc,
} from '../feelings/feeling'
import { useMinuteTick } from '../feelings/useMinuteTick'
import { moodFor, readCare } from '../mochi/mochiMood'
import { Mochi } from '../mochi/Mochi'
import { WaterPlay } from './WaterPlay'
import { usePageVisible } from './usePageVisible'
import type { IslandVisit } from './islandRepository'
import { SharedIsland } from './IslandScene'
import { PlayfulMochi } from './PlayfulMochi'
import { VisitScene } from './VisitScene'

import './island.css'

export function FriendIslandScreen({ own = false }: { own?: boolean }) {
  const { feelings, island } = useServices()
  const now = useClock()()
  const [feeling, setFeeling] = useState<FeelingDoc | null>(null)
  const [activity, setActivity] = useState<ActivityDoc | null>(null)
  const [visitorFeeling, setVisitorFeeling] = useState<FeelingDoc | null>(null)
  const [visitorActivity, setVisitorActivity] = useState<ActivityDoc | null>(null)
  const [visitFailed, setVisitFailed] = useState(false)
  const [otherVisit, setOtherVisit] = useState<IslandVisit | null | undefined>(undefined)
  const campus = own ? island.isNoe() : !island.isNoe()
  const host = campus ? copy.island.noe : copy.island.khant
  const visitor = campus ? copy.island.khant : copy.island.noe
  const visible = usePageVisible()
  const sailing = useLocation().state?.sailing === true

  useEffect(() => own ? feelings.watchMine(setFeeling) : feelings.watchOther(setFeeling), [feelings, own])
  useEffect(() => own ? feelings.watchMyActivity(setActivity) : feelings.watchOtherActivity(setActivity), [feelings, own])
  useEffect(() => {
    void island.chooseIsland(campus ? 'noe' : 'khant').catch(() => setVisitFailed(true))
  }, [island, campus])
  useEffect(() => island.watchOtherVisit(setOtherVisit), [island])
  useEffect(() => own ? feelings.watchOther(setVisitorFeeling) : feelings.watchMine(setVisitorFeeling), [feelings, own])
  useEffect(() => own ? feelings.watchOtherActivity(setVisitorActivity) : feelings.watchMyActivity(setVisitorActivity), [feelings, own])
  useMinuteTick()

  const currentActivity = activeActivity(activity, now)
  const currentFeeling = activeFeeling(feeling, now)
  const expression = currentFeeling
    ? expressionFor(currentFeeling)
    : currentActivity
      ? expressionForActivity(currentActivity)
      : own ? moodFor({ now, ...readCare() }) : 'idle'

  const visitorCurrentFeeling = activeFeeling(visitorFeeling, now)
  const visitorCurrentActivity = activeActivity(visitorActivity, now)
  const visitorExpression = visitorCurrentFeeling
    ? expressionFor(visitorCurrentFeeling)
    : visitorCurrentActivity
      ? expressionForActivity(visitorCurrentActivity)
      : moodFor({ now, ...readCare() })

  const destination = campus ? 'noe' : 'khant'
  const otherHome = island.isNoe() ? 'khant' : 'noe'
  const otherIsHere = otherVisit !== undefined && (otherVisit?.destination ?? otherHome) === destination

  return (
    <main className={`island-screen${visible ? '' : ' island-paused'}`}>
      <div className={`campus-frame${sailing ? ' campus-by-sea' : ''}`}>
        <VisitScene campus={campus} />
        <WaterPlay />
        {(
          <Link className="far-island-link" to="/between-islands" aria-label={copy.sharedIsland}>
            <svg viewBox="-110 -44 220 90" aria-hidden="true">
              <SharedIsland x={0} y={0} />
            </svg>
          </Link>
        )}
        <Link className="return-dock-link" to="/between-islands" aria-label={copy.sharedIsland} />
        {visitFailed && (
          <div className="visit-lantern-warning" role="status" aria-label={copy.island.visitOffline}>
            <svg viewBox="0 0 40 52" aria-hidden="true">
              <path d="M20 2v5M20 45v5M5 26H2m36 0h-3M8 14l-3-3m30 30-3-3M32 14l3-3M8 38l-3 3" stroke="var(--sun)" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 12h16l4 8v13l-12 9L8 33V20Z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M14 20h12v12H14z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2" />
              <path d="m16 23 4 3 4-3" fill="none" stroke="var(--accent-ink)" strokeWidth="1.6" />
            </svg>
            <span className="visually-hidden">{copy.island.visitOffline}</span>
          </div>
        )}
        {(own || otherIsHere) && <div className="campus-resident">
          <PlayfulMochi together={otherIsHere}
            bow={campus}
            expression={expression}
            size={64}
            label={host}
          />
          {currentActivity && <small>{copy.activities.label[currentActivity]}</small>}
        </div>}
        {((own && otherIsHere) || !own) && <div className="campus-visitor">
          <PlayfulMochi together={otherIsHere} bow={!campus} expression={visitorExpression} size={60} label={visitor} />
        </div>}
      </div>
      {sailing && <div className="visit-crossing" aria-hidden="true">
        <div className="visit-ferry">
          <svg viewBox="0 0 140 110" width="140" height="110"><BoatArt><Mochi bow={island.isNoe()} expression={own ? expression : visitorExpression} size={57} label={own ? host : visitor} /></BoatArt></svg>    </div>
      </div>}
    </main>
  )
}
