import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
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
import { Mochi } from '../mochi/Mochi'
import { usePageVisible } from './usePageVisible'
import { BackToIsland } from './BackToIsland'
import { VisitScene } from './VisitScene'
import { formatVisitAge } from './visitTime'

import './island.css'

export function FriendIslandScreen() {
  const { feelings, island } = useServices()
  const now = useClock()()
  const [feeling, setFeeling] = useState<FeelingDoc | null>(null)
  const [activity, setActivity] = useState<ActivityDoc | null>(null)
  const [visit, setVisit] = useState<{ visitedAt: Date | null } | null>(null)
  const [visitFailed, setVisitFailed] = useState(false)
  const recorded = useRef(false)
  const campus = !island.isNoe()
  const host = campus ? copy.island.noe : copy.island.khant
  const visitor = campus ? copy.island.khant : copy.island.noe
  const visible = usePageVisible()
  const sailing = useLocation().state?.sailing === true

  useEffect(() => feelings.watchOther(setFeeling), [feelings])
  useEffect(() => feelings.watchOtherActivity(setActivity), [feelings])
  useEffect(() => island.watchMyVisit(setVisit), [island])
  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    void island.visitOtherIsland().catch(() => setVisitFailed(true))
  }, [island])
  useMinuteTick()

  const currentActivity = activeActivity(activity, now)
  const currentFeeling = activeFeeling(feeling, now)
  const expression = currentFeeling
    ? expressionFor(currentFeeling)
    : currentActivity
      ? expressionForActivity(currentActivity)
      : 'idle'

  return (
    <main className={`island-screen${visible ? '' : ' island-paused'}`}>
      <div className={`campus-frame${sailing ? ' campus-by-sea' : ''}`}>
        <VisitScene campus={campus} />
        <section className="visit-island-card" aria-labelledby="visit-island-title">
          <h1 id="visit-island-title">{campus ? copy.island.campus : copy.island.studio}</h1>

          {visit?.visitedAt && (
            <p>{copy.island.myLastVisit(formatVisitAge(visit.visitedAt, now))}</p>
          )}
          {visitFailed && <p role="status">{copy.island.visitOffline}</p>}
          <BackToIsland />
        </section>
        <div className="campus-resident">
          <Mochi
            expression={expression}
            size={64}
            label={host}
          />
          <strong>{host}</strong>
          {currentActivity && <small>{copy.activities.label[currentActivity]}</small>}
        </div>
        <div className="campus-visitor">
          <Mochi expression="happy" size={60} label={visitor} />
          <strong>{visitor}</strong>
        </div>
      </div>
      {sailing && <div className="visit-crossing" aria-hidden="true">
        <div className="visit-ferry">
          <Mochi expression="happy" size={44} label={visitor} />
          <svg viewBox="0 0 100 70" width="100" height="70">
            <g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
              <path d="M60 51 V6 L87 40 H60" fill="var(--accent)" />
              <path d="M5 48 Q48 54 96 45 L77 64 H23Z" fill="var(--cream)" />
            </g>
          </svg>
        </div>
      </div>}
    </main>
  )
}
