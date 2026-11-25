import { useEffect, useId, useRef, useState } from 'react'
import { copy } from '../../copy/copy'

export function WaterPlay() {
  const fishId = useId()
  const anchor = useRef<HTMLButtonElement>(null)
  const [point, setPoint] = useState<{x: number; y: number} | null>(null)
  const [jump, setJump] = useState(0)
  const audio = useRef<AudioContext | null>(null)
  useEffect(() => () => { void audio.current?.close().catch(() => {}) }, [])
  useEffect(() => {
    const frame = anchor.current?.parentElement
    if (!frame) return
    const tap = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-sea]')) return
      const bounds = frame.getBoundingClientRect()
      setPoint({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
      void splash()
    }
    frame.addEventListener('click', tap)
    return () => frame.removeEventListener('click', tap)
  }, [])
  async function splash() {
    setJump(value => value + 1)
    try {
      const context = audio.current ?? new AudioContext()
      audio.current = context
      await context.resume()
      if (context.state !== 'running') return
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * .6), context.sampleRate)
      const samples = buffer.getChannelData(0)
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
      const source = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      source.buffer = buffer
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2200, context.currentTime)
      filter.frequency.exponentialRampToValueAtTime(180, context.currentTime + .6)
      gain.gain.setValueAtTime(.001, context.currentTime)
      gain.gain.linearRampToValueAtTime(.09, context.currentTime + .025)
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .6)
      source.connect(filter).connect(gain).connect(context.destination)
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
      source.start()
    } catch { /* Water remains interactive when audio is unavailable. */ }
  }
  return <button ref={anchor} style={point ? { left: point.x - 80, top: point.y - 76, right: "auto", bottom: "auto", width: 160, height: 100 } : undefined} className="water-play water-play-anywhere" type="button" aria-label={copy.island.playWater} onClick={() => void splash()}>
    <svg viewBox="0 0 200 100" aria-hidden="true">
      <defs><linearGradient id={fishId} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="var(--sea-deep)" /><stop offset=".45" stopColor="var(--sky-deep)" /><stop offset=".6" stopColor="var(--foam)" /><stop offset="1" stopColor="var(--mochi-shade)" />
      </linearGradient></defs>
      <g className="water-idle-ripples" fill="none" stroke="var(--foam)" opacity=".55" strokeWidth="1.5">
        <path d="M25 69q14 -4 28 0m62 11q20 -5 40 0m-85 9q12 -3 24 0" />
      </g>
      {jump > 0 && <g key={jump}>
        <ellipse className="fish-ripple" cx="100" cy="76" rx="22" ry="4" fill="none" stroke="var(--foam)" strokeWidth="2" />
        <g className="water-jumping-fish">
          <path d="M72 72Q88 55 110 68L129 58 124 72 129 84 110 76Q89 88 72 72Z" fill={`url(#${fishId})`} stroke="var(--ink-soft)" strokeWidth=".8" />
          <path d="m92 63 9 -9 6 12 m-14 14 9 7 2 -9" fill="var(--sea-deep)" stroke="var(--ink-soft)" strokeWidth=".7" />
          <path d="M84 64q6 8 0 16 M111 70l13 -9m-13 13 13 8" fill="none" stroke="var(--ink-soft)" strokeWidth=".8" />
          <path d="M87 70q11 -4 22 1" fill="none" stroke="var(--foam)" strokeWidth="1" />
          <circle cx="79" cy="70" r="1.7" fill="var(--ink)" /><circle cx="78.6" cy="69.6" r=".5" fill="var(--foam)" />

        </g>
        <g className="fish-droplets" fill="var(--foam)">
          <ellipse cx="73" cy="60" rx="2" ry="4" /><ellipse cx="128" cy="64" rx="2" ry="3" />
        </g>
      </g>}
    </svg>
  </button>
}
