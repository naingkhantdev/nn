import { useEffect, useState } from 'react'
import { copy } from '../../copy/copy'
import { useClock } from '../../core/clock'
import { useServices } from '../../core/services'
import { BackToIsland } from '../island/BackToIsland'
import { Mochi } from '../mochi/Mochi'
import { activeActivity, activeFeeling, activities, expressionFor, expressionForActivity, feelings, treatFor, type ActivityDoc, type FeelingDoc } from './feeling'
import { useMinuteTick } from './useMinuteTick'
import '../auth/auth.css'
import './feelings.css'

export function FeelingsScreen() {
  const { feelings: repo } = useServices()
  const clock = useClock()
  useMinuteTick()
  const [mine, setMine] = useState<FeelingDoc | null>(null)
  const [other, setOther] = useState<FeelingDoc | null>(null)
  const [myActivity, setMyActivity] = useState<ActivityDoc | null>(null)
  const [friendActivity, setFriendActivity] = useState<ActivityDoc | null>(null)
  const [treatNote, setTreatNote] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => repo.watchMine(setMine), [repo])
  useEffect(() => repo.watchOther(setOther), [repo])
  useEffect(() => repo.watchMyActivity(setMyActivity), [repo])
  useEffect(() => repo.watchOtherActivity(setFriendActivity), [repo])

  const now = clock()
  const myFeeling = activeFeeling(mine, now)
  const theirFeeling = activeFeeling(other, now)
  const myCurrentActivity = activeActivity(myActivity, now)
  const friendCurrentActivity = activeActivity(friendActivity, now)

  async function sendTreat() {
    if (!theirFeeling || sending) return
    setSending(true)
    setTreatNote(null)
    try {
      await repo.sendTreat(treatFor(theirFeeling))
      setTreatNote(copy.feelings.treatSent)
    } catch {
      setTreatNote(copy.feelings.treatFailed)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="auth-screen feelings-screen">
      <h1 className="auth-title">{copy.feelings.title}</h1>
      <p className="auth-intro">{copy.feelings.intro}</p>

      <section className="auth-card" aria-labelledby="mine-title">
        <h2 id="mine-title" className="feelings-section-title">
          {copy.feelings.mineTitle}
        </h2>
        <div className="feelings-grid">
          {feelings.map((f) => (
            <button
              key={f}
              type="button"
              className="feeling-option"
              aria-pressed={myFeeling === f}
              onClick={() => repo.set(f)}
            >
              <Mochi expression={expressionFor(f)} size={56} />
              <span>{copy.feelings.label[f]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="feeling-nothing"
          aria-pressed={myFeeling === null}
          onClick={() => repo.clear()}
        >
          {copy.feelings.nothing}
        </button>
      </section>

      <section className="auth-card" aria-labelledby="my-day-title">
        <h2 id="my-day-title" className="feelings-section-title">
          {copy.activities.title}
        </h2>
        <p className="auth-intro">{copy.activities.intro}</p>
        <div className="feelings-grid">
          {activities.map((activity) => (
            <button
              key={activity}
              type="button"
              className="feeling-option"
              aria-pressed={myCurrentActivity === activity}
              onClick={() => repo.setActivity(activity)}
            >
              <Mochi expression={expressionForActivity(activity)} size={48} />
              <span>{copy.activities.label[activity]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="feeling-nothing"
          aria-pressed={myCurrentActivity === null}
          onClick={() => repo.clearActivity()}
        >
          {copy.activities.clear}
        </button>
      </section>

      <section className="auth-card" aria-labelledby="friend-day-title">
        <h2 id="friend-day-title" className="feelings-section-title">
          {copy.activities.friendTitle}
        </h2>
        {friendCurrentActivity ? (
          <div className="feelings-other">
            <Mochi expression={expressionForActivity(friendCurrentActivity)} size={72} />
            <p className="feelings-other-label">{copy.activities.label[friendCurrentActivity]}</p>
          </div>
        ) : (
          <p className="auth-intro">{copy.activities.none}</p>
        )}
      </section>

      <section className="auth-card" aria-labelledby="other-title">
        <h2 id="other-title" className="feelings-section-title">
          {copy.feelings.otherTitle}
        </h2>
        {theirFeeling ? (
          <div className="feelings-other">
            <Mochi expression={expressionFor(theirFeeling)} size={72} />
            <p className="feelings-other-label">{copy.feelings.label[theirFeeling]}</p>
            <button type="button" className="auth-button" disabled={sending} onClick={() => void sendTreat()}>
              {copy.feelings.sendTreat[treatFor(theirFeeling)]}
            </button>
          </div>
        ) : (
          <p className="auth-intro">{copy.feelings.otherNone}</p>
        )}
        {treatNote && (
          <p className="auth-message" role="status">
            {treatNote}
          </p>
        )}
      </section>

      <BackToIsland />
    </div>
  )
}
