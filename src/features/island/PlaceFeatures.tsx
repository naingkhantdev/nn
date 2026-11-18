import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { copy } from '../../copy/copy'
import { useServices } from '../../core/services'
import { useClock } from '../../core/clock'
import { myanmarDayNumber } from '../../core/time'
import { useMinuteTick } from '../feelings/useMinuteTick'
import { Mochi } from '../mochi/Mochi'
import { BackToIsland } from './BackToIsland'
import type { GardenMemory, IslandLetter, IslandSulk, SulkComfort, SulkLevel } from './islandRepository'
import '../auth/auth.css'
import './places.css'

function dateInputValue(date: Date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

function FeaturePage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="auth-screen island-feature"><Mochi expression="happy" size={74} /><h1 className="auth-title">{title}</h1>{children}<BackToIsland /></main>
}

function useLetters(kind: 'snail' | 'bottle', box: 'sent' | 'received') {
  const { island } = useServices()
  const [items, setItems] = useState<IslandLetter[] | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const off = island.watchLetters(kind, box, setItems)
    return off
  }, [island, kind, box, tick])
  useEffect(() => {
    if (kind !== 'bottle' || box !== 'received') return
    const id = window.setInterval(() => setTick((value) => value + 1), 60_000)
    return () => window.clearInterval(id)
  }, [kind, box])
  return items
}

function LetterList({ items, empty }: { items: IslandLetter[] | null; empty: string }) {
  if (items === null) return <p className="auth-intro" role="status">{copy.placesUi.loading}</p>
  if (!items.length) return <p className="auth-intro">{empty}</p>
  return <ul className="island-letter-list">{items.map((item) => <li key={item.id} className="island-letter">
    <span className="island-letter-mark" aria-hidden="true" />
    {item.locked ? <p>{copy.placesUi.waitingForDate}</p> : <p>{item.text}</p>}
    {item.opensAt && <small>{copy.placesUi.opensOn} {item.opensAt.toLocaleDateString()}</small>}
  </li>)}</ul>
}

export function SnailPostScreen() {
  const { island } = useServices()
  const [text, setText] = useState('')
  const [sent, setSent] = useState<IslandLetter[] | null>(null)
  const received = useLetters('snail', 'received')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => island.watchLetters('snail', 'sent', setSent), [island])
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try { await island.writeLetter('snail', text); setText('') }
    catch (err) { setError(err instanceof Error ? err.message : copy.placesUi.sendFailed) }
    finally { setBusy(false) }
  }
  return <FeaturePage title={copy.placesUi.snailTitle}>
    <p className="auth-intro">{copy.placesUi.snailIntro}</p>
    <form className="auth-card island-feature-form" onSubmit={submit}>
      <label className="auth-field">{copy.placesUi.letterLabel}<textarea className="island-feature-text" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} /></label>
      {error && <p className="auth-message" role="alert">{error}</p>}
      <button className="auth-button" type="submit" disabled={busy || !text.trim()}>{busy ? copy.placesUi.sending : copy.placesUi.sendSnail}</button>
    </form>
    <section className="island-feature-section"><h2>{copy.placesUi.incoming}</h2><LetterList items={received} empty={copy.placesUi.noLetters} /></section>
    <details className="island-feature-details"><summary>{copy.placesUi.sentLetters}</summary><LetterList items={sent} empty={copy.placesUi.noSentLetters} /></details>
  </FeaturePage>
}

export function MessageBottleScreen() {
  const { island } = useServices()
  const [text, setText] = useState('')
  const [date, setDate] = useState(() => { const next = new Date(); next.setDate(next.getDate() + 1); return next.toLocaleDateString('en-CA') })
  const [sent, setSent] = useState<IslandLetter[] | null>(null)
  const received = useLetters('bottle', 'received')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => island.watchLetters('bottle', 'sent', setSent), [island])
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try { await island.writeLetter('bottle', text, new Date(`${date}T00:00:00`)); setText('') }
    catch (err) { setError(err instanceof Error ? err.message : copy.placesUi.sendFailed) }
    finally { setBusy(false) }
  }
  return <FeaturePage title={copy.placesUi.bottleTitle}>
    <p className="auth-intro">{copy.placesUi.bottleIntro}</p>
    <form className="auth-card island-feature-form" onSubmit={submit}>
      <label className="auth-field">{copy.placesUi.letterLabel}<textarea className="island-feature-text" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} /></label>
      <label className="auth-field">{copy.placesUi.openDate}<input type="date" min={dateInputValue(new Date(Date.now() + 86_400_000))} value={date} onChange={(e) => setDate(e.target.value)} /></label>
      {error && <p className="auth-message" role="alert">{error}</p>}
      <button className="auth-button" type="submit" disabled={busy || !text.trim() || !date}>{busy ? copy.placesUi.sending : copy.placesUi.sealBottle}</button>
    </form>
    <section className="island-feature-section"><h2>{copy.placesUi.bottlesForYou}</h2><LetterList items={received} empty={copy.placesUi.noBottles} /></section>
    <details className="island-feature-details"><summary>{copy.placesUi.bottlesSent}</summary><LetterList items={sent} empty={copy.placesUi.noSentBottles} /></details>
  </FeaturePage>
}

export function GardenScreen() {
  const { island } = useServices()
  const [memories, setMemories] = useState<GardenMemory[] | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => island.watchGarden(setMemories), [island])
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return
    setBusy(true); setError(null)
    try { await island.addMemory(text); setText('') }
    catch (err) { setError(err instanceof Error ? err.message : copy.placesUi.memoryFailed) }
    finally { setBusy(false) }
  }
  return <FeaturePage title={copy.placesUi.gardenTitle}>
    <p className="auth-intro">{copy.placesUi.gardenIntro}</p>
    <form className="auth-card island-feature-form" onSubmit={submit}>
      <label className="auth-field">{copy.placesUi.memoryLabel}<textarea className="island-feature-text" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} /></label>
      {error && <p className="auth-message" role="alert">{error}</p>}
      <button className="auth-button" type="submit" disabled={busy || !text.trim()}>{busy ? copy.placesUi.planting : copy.placesUi.plantMemory}</button>
    </form>
    <section className="island-garden" aria-label={copy.placesUi.gardenTitle}>
      {memories === null ? <p className="auth-intro" role="status">{copy.placesUi.loading}</p> : memories.length === 0 ? <p className="auth-intro">{copy.placesUi.emptyGarden}</p> : memories.map((memory, i) => <article className="island-memory" key={memory.id}>
        <span className={`island-memory-flower island-memory-flower-${i % 3}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <p>{memory.text}</p>
        <button type="button" className="auth-link-button" onClick={() => void island.deleteMemory(memory.id)}>{copy.placesUi.removeMemory}</button>
      </article>)}
    </section>
    <p className="island-note">{copy.placesUi.sharedNote}</p>
  </FeaturePage>
}

export function LanternScreen() {
  const { island } = useServices()
  const uid = island.myUid()
  const [state, setState] = useState<{ day: number; litBy: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const day = myanmarDayNumber(useClock()())
  useEffect(() => island.watchLantern(setState), [island])
  const litToday = state?.day === day && state.litBy.includes(uid)
  const paired = state?.day === day && state.litBy.length > 1
  async function light() {
    setBusy(true); setError(null)
    try { await island.lightLantern() }
    catch (err) { setError(err instanceof Error ? err.message : copy.placesUi.lanternFailed) }
    finally { setBusy(false) }
  }
  return <FeaturePage title={copy.placesUi.lanternTitle}>
    <p className="auth-intro">{copy.placesUi.lanternIntro}</p>
    <div className={`island-lantern${litToday ? ' is-lit' : ''}${paired ? ' is-paired' : ''}`} aria-label={paired ? copy.placesUi.pairedLight : litToday ? copy.placesUi.litLight : copy.placesUi.unlitLight}>
      {paired && <><span className="island-firefly island-firefly-one" /><span className="island-firefly island-firefly-two" /><span className="island-firefly island-firefly-three" /></>}
      <svg viewBox="0 0 120 180" role="img" aria-hidden="true"><path d="M60 4v22M30 29q30-22 60 0l-8 14H38z"/><path className="lantern-body" d="M36 43h48l-5 75q-19 18-38 0z"/><path d="M38 53q22 10 44 0M40 105q20 10 40 0M60 44v77"/><path d="M46 122v20m28-20v20M49 143h22"/></svg>
    </div>
    <p className="auth-intro" role="status">{paired ? copy.placesUi.pairedLight : litToday ? copy.placesUi.litToday : copy.placesUi.notLitYet}</p>
    {error && <p className="auth-message" role="alert">{error}</p>}
    <button className="auth-button" type="button" onClick={() => void light()} disabled={busy || litToday}>{busy ? copy.placesUi.lighting : litToday ? copy.placesUi.litButton : copy.placesUi.lightLantern}</button>
  </FeaturePage>
}

export function SulkCloudScreen() {
  const { island } = useServices()
  const uid = island.myUid()
  const [sulks, setSulks] = useState<IslandSulk[]>([])
  const [history, setHistory] = useState<IslandSulk[]>([])
  const now = useClock()()
  useMinuteTick()
  const [comforts, setComforts] = useState<SulkComfort[]>([])
  const [level, setLevel] = useState<SulkLevel>('cloudy')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [drops, setDrops] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const active = sulks.filter((s) => s.startedAt && !s.endedAt && now - s.startedAt.getTime() < 24 * 3_600_000)
  const mine = active.find((s) => s.sulkerUid === uid)
  const theirs = active.find((s) => s.sulkerUid !== uid)
  const comfortTarget = mine ?? theirs
  useEffect(() => island.watchActiveSulks(setSulks), [island])
  useEffect(() => island.watchSulkHistory(setHistory), [island])
  useEffect(() => {
    if (!comfortTarget) { setComforts([]); return }
    return island.watchComforts(comfortTarget.id, setComforts)
  }, [island, comfortTarget?.id])
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(null)
    try { await action() }
    catch (err) { setError(err instanceof Error ? err.message : copy.placesUi.sulkFailed) }
    finally { setBusy(false) }
  }
  function popDrop() {
    const next = drops + 1
    setDrops(next)
    if (next >= 3 && theirs) {
      setDrops(0)
      void run(() => island.comfortSulk(theirs.id, 'drops'))
    }
  }
  return <FeaturePage title={copy.placesUi.sulkTitle}>
    <p className="auth-intro">{copy.placesUi.sulkIntro}</p>
    {!mine && <form className="auth-card island-feature-form" onSubmit={(e) => { e.preventDefault(); void run(() => island.startSulk(level, reason)) }}>
      <label className="auth-field">{copy.placesUi.sulkLevel}<select value={level} onChange={(e) => setLevel(e.target.value as SulkLevel)}><option value="cloudy">{copy.placesUi.levelCloudy}</option><option value="rain">{copy.placesUi.levelRain}</option><option value="storm">{copy.placesUi.levelStorm}</option></select></label>
      <label className="auth-field">{copy.placesUi.sulkReason}<textarea className="island-feature-text" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      {error && <p className="auth-message" role="alert">{error}</p>}
      <button className="auth-button" type="submit" disabled={busy}>{busy ? copy.placesUi.sulkStarting : copy.placesUi.startSulk}</button>
    </form>}
    {mine && <section className="island-feature-section"><h2>{copy.placesUi.yourCloud}</h2><p className="auth-intro">{mine.reason || copy.placesUi.noReason}</p><button className="auth-button" type="button" disabled={busy} onClick={() => void run(() => island.forgiveSulk(mine.id))}>{copy.placesUi.forgive}</button></section>}
    {theirs && <section className="island-feature-section"><h2>{copy.placesUi.acrossCloud}</h2><p className="auth-intro">{theirs.reason || copy.placesUi.noReason}</p>
      <label className="auth-field">{copy.placesUi.comfortNote}<textarea className="island-feature-text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button className="auth-button" type="button" disabled={busy} onClick={() => void run(async () => { await island.comfortSulk(theirs.id, note.trim() ? 'note' : 'hug', note); setNote('') })}>{note.trim() ? copy.placesUi.sendComfort : copy.placesUi.sendHug}</button>
      <button className="auth-link-button" type="button" disabled={busy} onClick={popDrop}>{copy.placesUi.popDrops} ({drops}/3)</button>
    </section>}
    {comforts.length > 0 && <section className="island-feature-section"><p className="island-note">{copy.placesUi.comfortCount(comforts.length)}</p>{comforts.map((comfort) => <p className="island-note" key={comfort.id}>{comfort.kind === 'note' ? comfort.text : comfort.kind === 'hug' ? copy.placesUi.comfortHug : copy.placesUi.comfortDrops}</p>)}</section>}
    {error && !mine && !theirs && <p className="auth-message" role="alert">{error}</p>}
    <details className="island-feature-details"><summary>{copy.placesUi.sulkHistory}</summary><p className="auth-intro">{copy.placesUi.historySummary(history.length)}</p></details>
  </FeaturePage>
}
