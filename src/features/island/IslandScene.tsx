import { SCENE_HEIGHT, SCENE_WIDTH, islandPlaces, type IslandPlaceId } from './places'
import { WeatherLayer } from './WeatherLayer'
import type { Weather } from './weather'

// One wave band: a gentle repeat every 40 units, wider than the scene so it
// can slide left by one period and loop seamlessly.
function wavePath(y: number, amp: number): string {
  let d = `M-80 ${y}`
  for (let x = -80; x < SCENE_WIDTH + 80; x += 40) d += ` q10 ${-amp} 20 0 t20 0`
  return `${d} V${SCENE_HEIGHT} H-80 Z`
}

function SmallCloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="var(--cloud)">
      <ellipse rx="30" ry="13" />
      <circle cx="-12" cy="-8" r="12" />
      <circle cx="9" cy="-12" r="15" />
    </g>
  )
}

function House() {
  return (
    <g transform="translate(175 330)">
      <ellipse cy="26" rx="40" ry="7" fill="var(--grass-deep)" opacity="0.5" />
      <path d="M-36 24 V0 A36 34 0 0 1 36 0 V24 Z" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M-42 2 A42 40 0 0 1 42 2" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" />
      <path d="M-10 24 V8 A10 10 0 0 1 10 8 V24 Z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="22" cy="-6" r="6" fill="var(--sky)" stroke="var(--ink)" strokeWidth="2.5" />
    </g>
  )
}

function StarJar() {
  return (
    <g transform="translate(268 350)">
      <ellipse cy="22" rx="20" ry="5" fill="var(--grass-deep)" opacity="0.5" />
      <rect x="-12" y="-28" width="24" height="7" rx="2" fill="var(--accent)" />
      <path d="M-16 -20 H16 Q20 -20 20 -14 V14 Q20 22 12 22 H-12 Q-20 22 -20 14 V-14 Q-20 -20 -16 -20 Z" fill="var(--foam)" stroke="var(--ink)" strokeWidth="2.5" />
      {[
        [-7, -6],
        [6, 2],
        [-4, 12],
        [8, -10],
      ].map(([sx, sy], i) => (
        <path key={i} transform={`translate(${sx} ${sy}) scale(0.5)`} d="M0 -9 L2.6 -2.8 9 -2.8 3.8 1.2 5.8 8 0 4 -5.8 8 -3.8 1.2 -9 -2.8 -2.6 -2.8 Z" fill="var(--sun)" />
      ))}
    </g>
  )
}

function FeelingsSign() {
  return (
    <g transform="translate(88 350)">
      <ellipse cy="24" rx="18" ry="4" fill="var(--grass-deep)" opacity="0.5" />
      <rect x="-3" y="-4" width="6" height="28" rx="2" fill="#c99a6b" />
      <path d="M0 -10 C-6 -22 -24 -18 -18 -4 C-14 4 -4 8 0 14 C4 8 14 4 18 -4 C24 -18 6 -22 0 -10 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2.5" />
    </g>
  )
}

function SulkCloud() {
  return (
    <g transform="translate(282 128)" opacity="0.9">
      <SmallCloud x={0} y={0} scale={1.1} />
      <circle cx="-8" cy="-2" r="1.8" fill="var(--ink-soft)" />
      <circle cx="6" cy="-2" r="1.8" fill="var(--ink-soft)" />
    </g>
  )
}

/** A spot that is "still being built": a little mound with a flag. */
function BuildingSpot({ x, y, inSea = false }: { x: number; y: number; inSea?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {inSea ? (
        <ellipse cy="10" rx="20" ry="6" fill="var(--foam)" opacity="0.8" />
      ) : (
        <ellipse cy="10" rx="18" ry="7" fill="#e8c992" />
      )}
      <line x1="0" y1="10" x2="0" y2="-16" stroke="#a87a4f" strokeWidth="3" strokeLinecap="round" />
      <path d="M1 -16 L16 -11 L1 -6 Z" fill="var(--accent)" />
    </g>
  )
}

const building: IslandPlaceId[] = ['garden', 'lantern', 'snailPost', 'bottle']

/** The painted island. Purely decorative; the tappable places are HTML buttons on top. */
export function IslandScene({ weather }: { weather: Weather }) {
  return (
    <svg
      className="island-scene"
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width={SCENE_WIDTH} height="330" fill="var(--sky)" />
      <WeatherLayer weather={weather} />

      <g className="island-cloud island-cloud-a">
        <SmallCloud x={150} y={150} />
      </g>
      <g className="island-cloud island-cloud-b">
        <SmallCloud x={70} y={215} scale={0.8} />
      </g>

      <rect y="300" width={SCENE_WIDTH} height={SCENE_HEIGHT - 300} fill="var(--sea)" />
      <path className="island-wave island-wave-back" d={wavePath(300, 6)} fill="var(--sky-deep)" opacity="0.55" />

      {/* island */}
      <ellipse cx="180" cy="385" rx="158" ry="72" fill="var(--foam)" opacity="0.8" />
      <ellipse cx="180" cy="380" rx="150" ry="66" fill="var(--sand)" />
      <ellipse cx="180" cy="362" rx="128" ry="50" fill="var(--grass)" />

      {/* palm */}
      <g transform="translate(40 330)">
        <path d="M0 40 Q-4 10 6 -14" fill="none" stroke="#b98a5e" strokeWidth="7" strokeLinecap="round" />
        <path d="M6 -14 q-26 -6 -36 8 q18 -12 36 -8 q-10 -24 -32 -22 q24 4 32 22 q14 -22 36 -16 q-24 2 -36 16 q24 -2 32 18 q-14 -16 -32 -18 Z" fill="var(--grass-deep)" />
      </g>

      <path className="island-wave island-wave-front" d={wavePath(470, 7)} fill="var(--sea-deep)" opacity="0.45" />

      <House />
      <StarJar />
      <FeelingsSign />
      <SulkCloud />
      {islandPlaces
        .filter((p) => building.includes(p.id))
        .map((p) => (
          <BuildingSpot key={p.id} x={p.x} y={p.y} inSea={p.id === 'bottle'} />
        ))}
    </svg>
  )
}
