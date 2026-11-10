import type { ReactNode } from 'react'
import { copy } from '../../copy/copy'
import './mochi.css'

export const mochiExpressions = [
  'idle',
  'happy',
  'sleepy',
  'hungry',
  'tired',
  'bored',
  'homesick',
  'sulking',
  'dancing',
] as const

export type MochiExpression = (typeof mochiExpressions)[number]

interface MochiProps {
  expression: MochiExpression
  size?: number
  className?: string
}

const INK = 'var(--ink)'
const stroke = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' }

// Eye shapes, centred on the left (70,92) and right (130,92) eye positions.
const dotEyes = (
  <g className="mochi-eyes">
    <ellipse cx="70" cy="92" rx="6" ry="7.5" fill={INK} />
    <ellipse cx="130" cy="92" rx="6" ry="7.5" fill={INK} />
    <circle cx="72" cy="89" r="2" fill="var(--mochi)" />
    <circle cx="132" cy="89" r="2" fill="var(--mochi)" />
  </g>
)
const smileEyes = (
  <g>
    <path d="M62 94 Q70 84 78 94" {...stroke} />
    <path d="M122 94 Q130 84 138 94" {...stroke} />
  </g>
)
const closedEyes = (
  <g>
    <path d="M62 92 Q70 98 78 92" {...stroke} />
    <path d="M122 92 Q130 98 138 92" {...stroke} />
  </g>
)
const flatEyes = (
  <g>
    <path d="M63 93 H77" {...stroke} />
    <path d="M123 93 H137" {...stroke} />
  </g>
)
const heavyEyes = (
  <g>
    <path d="M62 90 H78" {...stroke} />
    <path d="M64 92 Q70 99 76 92" fill={INK} />
    <path d="M122 90 H138" {...stroke} />
    <path d="M124 92 Q130 99 136 92" fill={INK} />
  </g>
)

const faces: Record<Exclude<MochiExpression, 'sulking'>, { eyes: ReactNode; mouth: ReactNode; extra?: ReactNode }> = {
  idle: { eyes: dotEyes, mouth: <path d="M92 108 Q100 115 108 108" {...stroke} /> },
  happy: {
    eyes: smileEyes,
    mouth: <path d="M88 106 Q100 124 112 106 Z" fill="var(--mouth)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />,
  },
  sleepy: {
    eyes: closedEyes,
    mouth: <ellipse cx="100" cy="112" rx="4" ry="3" fill="var(--mouth)" stroke={INK} strokeWidth="3" />,
    extra: (
      <g className="mochi-zz" fill={INK} fontFamily="'Baloo 2', sans-serif" fontWeight="700">
        <text x="150" y="52" fontSize="20">z</text>
        <text x="166" y="36" fontSize="14">z</text>
      </g>
    ),
  },
  hungry: {
    eyes: dotEyes,
    mouth: <ellipse cx="100" cy="112" rx="7" ry="8" fill="var(--mouth)" stroke={INK} strokeWidth="3.5" />,
    extra: <path d="M114 110 q3 8 0 12 q-3 -4 0 -12" fill="var(--sea)" className="mochi-drool" />,
  },
  tired: { eyes: heavyEyes, mouth: <path d="M93 112 Q100 108 107 112" {...stroke} /> },
  bored: { eyes: flatEyes, mouth: <path d="M93 111 H107" {...stroke} /> },
  homesick: {
    eyes: dotEyes,
    mouth: <path d="M93 112 q3.5 -4 7 0 q3.5 4 7 0" {...stroke} />,
    extra: (
      <g transform="translate(150 40)" className="mochi-thought">
        <circle cx="-12" cy="22" r="3" fill="var(--cloud)" />
        <path d="M0 14 L12 4 L24 14 V28 H0 Z" fill="var(--sand)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="9" y="18" width="6" height="10" fill={INK} />
      </g>
    ),
  },
  dancing: {
    eyes: smileEyes,
    mouth: <path d="M88 106 Q100 124 112 106 Z" fill="var(--mouth)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />,
    extra: (
      <g fill="var(--accent)" className="mochi-notes" fontFamily="'Baloo 2', sans-serif" fontWeight="700" fontSize="22">
        <text x="24" y="50">♪</text>
        <text x="160" y="44">♫</text>
      </g>
    ),
  },
}

/** Mochi: a soft, squishy round friend. Original art, drawn in SVG. */
export function Mochi({ expression, size = 160, className }: MochiProps) {
  const height = Math.round((size * 180) / 200)
  const sulking = expression === 'sulking'
  const face = sulking ? null : faces[expression]

  return (
    <svg
      role="img"
      aria-label={copy.mochi.label[expression]}
      data-expression={expression}
      className={['mochi', `mochi--${expression}`, className].filter(Boolean).join(' ')}
      width={size}
      height={height}
      viewBox="0 0 200 180"
    >
      <ellipse cx="100" cy="166" rx="62" ry="8" fill="var(--shadow)" className="mochi-shadow" />
      <g className="mochi-body">
        {/* Body: a soft dumpling, flatter at the bottom. */}
        <path
          d="M100 40 C150 40 178 82 178 122 C178 150 150 162 100 162 C50 162 22 150 22 122 C22 82 50 40 100 40 Z"
          fill="var(--mochi)"
          stroke={INK}
          strokeWidth="4"
        />
        <path
          d="M34 132 C44 152 76 156 100 156 C124 156 156 152 166 132 C160 148 136 158 100 158 C64 158 40 148 34 132 Z"
          fill="var(--mochi-shade)"
        />
        {sulking ? (
          <g>
            {/* Turned away: a tiny tuft and puffed sides, no face. */}
            <path d="M92 44 Q100 26 108 44" {...stroke} />
            <ellipse cx="30" cy="112" rx="10" ry="8" fill="var(--blush)" opacity="0.9" />
            <ellipse cx="170" cy="112" rx="10" ry="8" fill="var(--blush)" opacity="0.9" />
            <g className="mochi-huff" fill="var(--cloud)" stroke={INK} strokeWidth="2.5">
              <circle cx="176" cy="58" r="9" />
              <circle cx="188" cy="46" r="6" />
            </g>
          </g>
        ) : (
          <g className="mochi-face">
            <path d="M88 48 Q100 36 112 48" fill="var(--leaf)" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="54" cy="110" rx="12" ry="7" fill="var(--blush)" />
            <ellipse cx="146" cy="110" rx="12" ry="7" fill="var(--blush)" />
            {face!.eyes}
            {face!.mouth}
          </g>
        )}
      </g>
      {face?.extra}
    </svg>
  )
}
