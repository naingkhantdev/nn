import { useEffect, useState, type ComponentProps } from 'react'
import { Mochi } from '../mochi/Mochi'
import { copy } from '../../copy/copy'

export function PlayfulMochi({ together, ...props }: ComponentProps<typeof Mochi> & { together: boolean }) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    setPlaying(true)
  }, [together])
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setPlaying(false), 1100)
    return () => window.clearTimeout(timer)
  }, [playing])
  return (
    <button
      type="button"
      className={`mochi-play${playing ? ' mochi-play-active' : ''}`}
      aria-label={copy.island.playWithMochi(props.label ?? copy.mochi.label[props.expression])}
      onClick={() => setPlaying(true)}
    >
      <Mochi {...props} expression={playing ? together ? 'dancing' : 'happy' : props.expression} />
      {playing && <svg className="mochi-play-sparks" viewBox="0 0 100 100" aria-hidden="true">
        <g fill="var(--sun)" stroke="var(--accent-ink)" strokeWidth="1">
          <path d="m12 30 3 7 7 1 -6 5 2 7 -6 -4 -6 4 2 -7 -6 -5 7 -1Z" />
          <path d="m84 13 3 7 7 1 -6 5 2 7 -6 -4 -6 4 2 -7 -6 -5 7 -1Z" />
        </g>
      </svg>}
    </button>
  )
}
