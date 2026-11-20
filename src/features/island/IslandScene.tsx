import { SCENE_HEIGHT, SCENE_WIDTH, islandPlaces, type IslandPlaceId } from './places'
import { WeatherLayer } from './WeatherLayer'
import type { Weather } from './weather'

function wavePath(y: number, amp: number, width = SCENE_WIDTH): string {
  let d = 'M-80 ' + y
  for (let x = -80; x < width + 80; x += 40) d += ' q10 ' + -amp + ' 20 0 t20 0'
  return d + ' V' + SCENE_HEIGHT + ' H-80 Z'
}

function SmallCloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'} fill="var(--cloud)">
      <ellipse rx="30" ry="13" />
      <circle cx="-12" cy="-8" r="12" />
      <circle cx="9" cy="-12" r="15" />
    </g>
  )
}

function House({ x = 175, y = 330, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="30" rx="42" ry="8" fill="var(--grass-deep)" opacity="0.35" />
      <rect x="-32" y="-7" width="64" height="38" rx="3" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M-40 -6 0 -40 40 -6 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-29 -12 -20 -20 M-13 -26 -6 -32 M8 -32 15 -26 M22 -20 30 -12" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 -27 V-42 H29 V-18" fill="var(--sand)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <g transform="translate(23 -45)"><g className="island-chimney-smoke"><circle cy="0" r="3" fill="var(--cloud)" /><circle cx="-4" cy="-4" r="2.2" fill="var(--cloud)" opacity="0.8" /></g></g>
      <rect x="-25" y="1" width="13" height="13" rx="2" fill="var(--sky)" stroke="var(--ink)" strokeWidth="2" />
      <rect className="island-window-glow" x="-23.5" y="2.5" width="10" height="10" rx="1" fill="var(--sun)" opacity="0.22" />
      <path d="M-18.5 2 V13 M-24 7.5 H-12" stroke="var(--ink-soft)" strokeWidth="1.5" />
      <rect x="12" y="1" width="13" height="13" rx="2" fill="var(--sky)" stroke="var(--ink)" strokeWidth="2" />
      <rect className="island-window-glow" x="13.5" y="2.5" width="10" height="10" rx="1" fill="var(--sun)" opacity="0.22" />
      <path d="M18.5 2 V13 M13 7.5 H24" stroke="var(--ink-soft)" strokeWidth="1.5" />
      <path d="M-7 31 V12 Q-7 7 0 7 Q7 7 7 12 V31 Z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="3" cy="20" r="1.3" fill="var(--accent-ink)" />
      <path d="M-28 18 H-9 L-11 22 H-26 Z M10 18 H27 L25 22 H12 Z" fill="var(--grass-deep)" stroke="var(--ink)" strokeWidth="1.2" />
      <path d="M-12 32 H12 M-17 35 H17" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function NeighborIsland({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'} aria-hidden="true">
      <ellipse cy="11" rx="47" ry="16" fill="var(--foam)" />
      <ellipse cy="7" rx="42" ry="13" fill="var(--sand)" />
      <ellipse cy="2" rx="35" ry="11" fill="var(--grass)" />
      <House x={-8} y={-13} scale={0.45} />
      <Flower x={24} y={3} tone="var(--accent)" />
    </g>
  )
}

function SharedIsland({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="12" rx="107" ry="23" fill="var(--foam)" />
    <ellipse cy="8" rx="103" ry="22" fill="var(--sand)" />
    <ellipse cy="3" rx="98" ry="19" fill="var(--grass)" />
    <StarJar x={-66} y={-5} scale={0.7} />
    <BuildingSpot place="snailPost" x={0} y={-5} />
    <BuildingSpot place="bottle" x={66} y={-5} />
  </g>
}

function StarJar({ x = 268, y = 350, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="29" rx="27" ry="6" fill="var(--grass-deep)" opacity="0.3" />
      <path d="M-24 27 H24 L19 32 H-19 Z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="1.8" />
      <path d="M-18 31 V35 M18 31 V35" stroke="var(--ink)" strokeWidth="2" />
      <rect x="-13" y="-29" width="26" height="8" rx="2" fill="var(--sand)" stroke="var(--ink)" strokeWidth="2" />
      <path d="M-10 -21 V-16 C-18 -13 -21 -8 -21 0 V17 Q-21 25 -13 25 H13 Q21 25 21 17 V0 C21 -8 18 -13 10 -16 V-21 Z" fill="var(--foam)" fillOpacity="0.86" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M-15 -12 Q-18 -8 -18 0 V15" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
      <path d="M-10 -17 H10 M-12 -25 H12" fill="none" stroke="var(--ink-soft)" strokeWidth="1.4" />
      <path className="island-jar-star" d="M-7 6 -5 1 0 5 5 -3 8 8 2 14 -6 12 Z" fill="var(--sun)" stroke="var(--accent-ink)" strokeWidth="1" />
      <path d="M-12 9 -10 6 -8 9 -10 12 Z M10 4 11 2 13 4 11 6 Z" fill="var(--cream)" stroke="var(--accent-ink)" strokeWidth="0.7" />
      <path d="M-2 -7 0 -12 2 -7" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="-10" r="1.5" fill="var(--cloud)" />
    </g>
  )
}

function FeelingsSign({ x = 88, y = 350, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="25" rx="19" ry="5" fill="var(--grass-deep)" opacity="0.35" />
      <path d="M0 20 V-4" stroke="var(--sand)" strokeWidth="4" strokeLinecap="round" />
      <rect x="-24" y="-19" width="48" height="31" rx="8" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="-10" cy="-5" r="5" fill="var(--sun)" />
      <path d="M-10 -14 V-11 M-19 -5 H-16 M-4 -11 -6 -9 M-17 -11 -15 -9" stroke="var(--accent-ink)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 -4 C2 -8 8 -9 10 -5 C15 -7 19 -3 17 1 H4 C1 1 0 -2 2 -4 Z" fill="var(--sky-deep)" stroke="var(--ink-soft)" strokeWidth="1.4" />
      <path d="M6 4 V7 M11 4 V7" stroke="var(--sea-deep)" strokeWidth="1.5" strokeLinecap="round" />

    </g>
  )
}

function SulkCloud({ x = 282, y = 128, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'} opacity="0.9">
      <SmallCloud x={0} y={0} scale={1.1} />
      <circle cx="-8" cy="-2" r="1.8" fill="var(--ink-soft)" />
      <circle cx="6" cy="-2" r="1.8" fill="var(--ink-soft)" />
    </g>
  )
}

function Flower({ x, y, tone = 'var(--sun)' }: { x: number; y: number; tone?: string }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ')'}>
      <g className="island-flower">
        <path d="M0 3 Q-1 8 1 12 M0 8 -3 6 M0 9 4 7" fill="none" stroke="var(--grass-deep)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cy="-4" r="2.5" fill={tone} />
        <circle cx="4" cy="-1" r="2.5" fill={tone} />
        <circle cx="2.5" cy="3.5" r="2.5" fill={tone} />
        <circle cx="-2.5" cy="3.5" r="2.5" fill={tone} />
        <circle cx="-4" cy="-1" r="2.5" fill={tone} />
        <circle r="1.7" fill="var(--accent-ink)" />
      </g>
    </g>
  )
}

function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <path d="M0 40 Q-4 10 6 -14" fill="none" stroke="var(--sand)" strokeWidth="7" strokeLinecap="round" />
      <path d="M6 -14 q-26 -6 -36 8 q18 -12 36 -8 q-10 -24 -32 -22 q24 4 32 22 q14 -22 36 -16 q-24 2 -36 16 q24 -2 32 18 q-14 -16 -32 -18 Z" fill="var(--grass-deep)" />
    </g>
  )
}

function GardenSpot({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="13" rx="27" ry="8" fill="var(--sand)" />
      <path d="M-26 4 V-8 M-13 4 V-8 M0 4 V-8 M13 4 V-8 M26 4 V-8 M-29 -8 H29 M-29 0 H29" stroke="var(--mochi)" strokeWidth="2.5" />
      <path d="M-22 6 Q-18 -10 -13 5 M-5 6 Q0 -13 5 6 M13 6 Q18 -12 22 6" fill="none" stroke="var(--grass-deep)" strokeWidth="2.5" />
      <circle cx="-18" cy="-3" r="3" fill="var(--accent)" /><circle cy="-6" r="3" fill="var(--sun)" /><circle cx="18" cy="-4" r="3" fill="var(--blush)" />
    </g>
  )
}

function LanternSpot({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <path d="M0 18 V-27" stroke="var(--ink-soft)" strokeWidth="2" />
      <path d="M-12 -18 Q0 -26 12 -18 L9 8 Q0 17 -9 8 Z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2" />
      <path d="M-10 -14 Q0 -18 10 -14 M-9 5 Q0 10 9 5 M0 -20 V12" fill="none" stroke="var(--accent-ink)" strokeWidth="1.4" />
      <ellipse cy="-2" rx="4" ry="9" fill="var(--cream)" opacity="0.28" />
      <path d="M0 17 V23 M-3 22 H3" stroke="var(--accent-ink)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M-7 -21 Q0 -28 7 -21" fill="none" stroke="var(--ink)" strokeWidth="2" />
      <path d="M-5 18 H5" stroke="var(--sand)" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function SnailPost({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="12" rx="22" ry="6" fill="var(--grass-deep)" opacity="0.35" />
      <path d="M0 11 V-19" stroke="var(--sand)" strokeWidth="4" />
      <path d="M-18 -20 Q-18 -25 -12 -25 H12 Q18 -25 18 -20 V-3 H-18 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M-12 -14 H12 M-12 -9 H7" stroke="var(--mochi)" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 -22 V-32 L26 -27 V-19" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <g className="island-mail-snail">
      <path d="M-10 8 Q-10 2 -4 2 H3 Q9 2 9 8 Z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="-4" cy="0" r="5" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M-6 -5 Q-5 -11 -2 -8 M-6 0 H-4" fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </g>
  )
}

function MessageBottle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <ellipse cy="13" rx="30" ry="8" fill="var(--foam)" opacity="0.75" />
      <g transform="rotate(-18)">
        <path d="M-29 -5 Q-29 -10 -23 -10 H-11 V-15 H11 V-10 H23 Q29 -10 29 -5 V5 Q29 11 22 11 H-22 Q-29 11 -29 5 Z" fill="var(--sea-deep)" fillOpacity="0.45" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="-13" y="-18" width="26" height="7" rx="2" fill="var(--sand)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M-22 -4 V2 M-17 -6 V2 M-7 -7 H7" stroke="var(--mochi)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
        <path d="M-4 -4 Q3 -1 8 3" fill="none" stroke="var(--sun)" strokeWidth="1.5" />
      </g>
    </g>
  )
}

function BuildingSpot({ x, y, place, scale = 1 }: { x: number; y: number; place: IslandPlaceId; scale?: number }) {
  if (place === 'garden') return <GardenSpot x={x} y={y} scale={scale} />
  if (place === 'lantern') return <LanternSpot x={x} y={y} scale={scale} />
  if (place === 'snailPost') return <SnailPost x={x} y={y} scale={scale} />
  return <MessageBottle x={x} y={y} scale={scale} />
}

function SkyKeepsakes() {
  return (
    <>
      <g transform="translate(288 226)">
        <g className="island-kite">
          <path d="M0 -17 14 0 0 18 -14 0 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
          <path d="M0 -15 V16 M-12 0 H12" fill="none" stroke="var(--cream)" strokeWidth="1.5" />
          <path d="M0 18 C-12 31 12 36 1 49 C-10 61 10 65 2 75" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" />
          <path d="m-5 29 6 5 6-5 M-5 51 1 56 7 51" fill="none" stroke="var(--sun)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g transform="translate(102 104)">
        <path className="island-twinkle island-twinkle-one" d="M0 -8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z" fill="var(--sun)" />
      </g>
      <g transform="translate(224 112) scale(.7)">
        <path className="island-twinkle island-twinkle-two" d="M0 -8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z" fill="var(--cream)" />
      </g>
      <g transform="translate(320 198) scale(.55)">
        <path className="island-twinkle island-twinkle-three" d="M0 -8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z" fill="var(--sun)" />
      </g>
    </>
  )
}

function PaperBoat({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
      <g className="island-boat">
        <path d="M-25 1 H25 L14 13 H-14 Z" fill="var(--sand)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-2 0 V-24 L14 -2 Z" fill="var(--mochi)" stroke="var(--ink)" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M2 -3 19 -3" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  )
}

function wideWeather(weather: Weather) {
  const rain = Array.from({ length: weather === 'storm' ? 56 : 32 }, (_, i) => {
    const x = (i * 137) % 1440
    const y = 70 + ((i * 89) % 360)
    return <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 18} />
  })

  return (
    <g data-weather={weather} aria-hidden="true">
      {weather === 'sunny' && (
        <g transform="translate(175 145)">
          <g className="weather-sun-rays" stroke="var(--sun)" strokeWidth="6" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line key={angle} x1="0" y1="-65" x2="0" y2="-82" transform={'rotate(' + angle + ')'} />
            ))}
          </g>
          <circle r="48" fill="var(--sun)" />
        </g>
      )}
      {(weather === 'cloudy' || weather === 'rain') && (
        <g className="weather-clouds-drift">
          <SmallCloud x={470} y={120} scale={2.1} />
          <SmallCloud x={970} y={100} scale={2.4} />
        </g>
      )}
      {weather === 'rain' && <g className="weather-rain" stroke="var(--sky-deep)" strokeWidth="3" strokeLinecap="round">{rain}</g>}
      {weather === 'storm' && (
        <>
          <rect className="weather-flash" width="1440" height="450" fill="var(--cloud)" />
          <SmallCloud x={360} y={120} scale={2.6} />
          <SmallCloud x={720} y={100} scale={2.8} />
          <SmallCloud x={1080} y={130} scale={2.5} />
          <g className="weather-rain" stroke="var(--sky-deep)" strokeWidth="3" strokeLinecap="round">{rain}</g>
        </>
      )}
      {weather === 'rainbow' && (
        <g fill="none" strokeWidth="16" opacity="0.85">
          <path d="M170 440 A550 550 0 0 1 1270 440" stroke="var(--accent)" />
          <path d="M205 440 A515 515 0 0 1 1235 440" stroke="var(--sun)" />
          <path d="M240 440 A480 480 0 0 1 1200 440" stroke="var(--grass)" />
          <path d="M275 440 A445 445 0 0 1 1165 440" stroke="var(--sky-deep)" />
        </g>
      )}
    </g>
  )
}

function landscapeWavePath(y: number, amp: number): string {
  let d = 'M-160 ' + y
  for (let x = -160; x < 1600; x += 100) d += ' q25 ' + -amp + ' 50 0 t50 0'
  return d + ' V900 H-160 Z'
}

const wideLandmarks = [
  { id: 'garden', x: 640, y: 690 },
  { id: 'lantern', x: 845, y: 700 },
] as const

export function IslandWideScene({ weather }: { weather: Weather }) {
  return (
    <svg className="island-scene island-scene-wide" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="island-wide-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky)" />
          <stop offset="1" stopColor="var(--sky-deep)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#island-wide-sky)" />
      {wideWeather(weather)}
      <g transform="translate(1280 265) scale(2.2)">
        <g className="island-kite">
          <path d="M0 -17 14 0 0 18 -14 0 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
          <path d="M0 -15 V16 M-12 0 H12" fill="none" stroke="var(--cream)" strokeWidth="1.5" />
          <path d="M0 18 C-12 31 12 36 1 49 C-10 61 10 65 2 75" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" />
          <path d="m-5 29 6 5 6-5 M-5 51 1 56 7 51" fill="none" stroke="var(--sun)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g transform="translate(380 220)"><path className="island-twinkle island-twinkle-one" d="M0 -8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z" fill="var(--sun)" /></g>
      <g transform="translate(1110 210) scale(.7)"><path className="island-twinkle island-twinkle-two" d="M0 -8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z" fill="var(--cream)" /></g>
      <g className="island-wide-cloud island-wide-cloud-one"><SmallCloud x={550} y={245} scale={1.7} /></g>
      <g className="island-wide-cloud island-wide-cloud-two"><SmallCloud x={1030} y={315} scale={1.2} /></g>
      <rect y="420" width="1440" height="480" fill="var(--sea)" />
      <path className="island-wave island-wave-back" d={landscapeWavePath(420, 11)} fill="var(--sky-deep)" opacity="0.58" />
      <ellipse cx="720" cy="615" rx="660" ry="260" fill="var(--foam)" />
      <ellipse cx="720" cy="590" rx="620" ry="235" fill="var(--sand)" />
      <ellipse cx="720" cy="555" rx="545" ry="190" fill="var(--grass)" />
      <path d="M250 571 C390 485 500 650 652 567 C818 476 940 640 1190 545" fill="none" stroke="var(--sand)" strokeWidth="22" strokeLinecap="round" opacity="0.88" />
      <path d="M250 571 C390 485 500 650 652 567 C818 476 940 640 1190 545" fill="none" stroke="var(--cream)" strokeWidth="3" strokeDasharray="3 13" strokeLinecap="round" />
      <path className="island-wave island-wave-front" d={landscapeWavePath(715, 13)} fill="var(--sea-deep)" opacity="0.42" />
      <g transform="translate(176 512) scale(4.5)"><Palm x={0} y={0} /></g>
      <House x={610} y={510} scale={2.05} />

      <FeelingsSign x={385} y={565} scale={1.75} />
      <SulkCloud x={1170} y={170} scale={2.8} />
      <Flower x={465} y={620} tone="var(--sun)" />
      <Flower x={538} y={510} tone="var(--accent)" />
      <Flower x={800} y={680} tone="var(--cream)" />
      <Flower x={1040} y={685} tone="var(--sun)" />
      {wideLandmarks.map((landmark) => (
        <BuildingSpot key={landmark.id} x={landmark.x} y={landmark.y} place={landmark.id} scale={2} />
      ))}
      <SharedIsland x={930} y={842} scale={1.7} />
      <NeighborIsland x={1290} y={710} scale={2.2} />
      <PaperBoat x={170} y={830} scale={2.2} />
    </svg>
  )
}

export function IslandScene({ weather }: { weather: Weather }) {
  return (
    <svg
      className="island-scene island-scene-portrait"
      viewBox={'0 0 ' + SCENE_WIDTH + ' ' + SCENE_HEIGHT}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="island-phone-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky)" />
          <stop offset="1" stopColor="var(--sky-deep)" />
        </linearGradient>
        <linearGradient id="island-phone-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sea)" />
          <stop offset="1" stopColor="var(--sea-deep)" />
        </linearGradient>
      </defs>
      <rect width={SCENE_WIDTH} height="330" fill="url(#island-phone-sky)" />
      <WeatherLayer weather={weather} />
      <SkyKeepsakes />
      <g className="island-cloud island-cloud-a"><SmallCloud x={150} y={150} /></g>
      <g className="island-cloud island-cloud-b"><SmallCloud x={70} y={215} scale={0.8} /></g>
      <rect y="300" width={SCENE_WIDTH} height={SCENE_HEIGHT - 300} fill="url(#island-phone-sea)" />
      <path className="island-wave island-wave-back" d={wavePath(300, 6)} fill="var(--sky-deep)" opacity="0.55" />

      <ellipse cx="180" cy="385" rx="158" ry="72" fill="var(--foam)" opacity="0.8" />
      <ellipse cx="180" cy="380" rx="150" ry="66" fill="var(--sand)" />
      <ellipse cx="180" cy="362" rx="128" ry="50" fill="var(--grass)" />
      <path d="M72 363 C108 339 132 388 170 367 C208 345 236 376 287 355" fill="none" stroke="var(--sand)" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
      <path d="M72 363 C108 339 132 388 170 367 C208 345 236 376 287 355" fill="none" stroke="var(--cream)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <Flower x={129} y={378} /><Flower x={232} y={373} tone="var(--accent)" /><Flower x={148} y={403} tone="var(--cream)" />
      <Palm x={40} y={330} />
      <path className="island-wave island-wave-front" d={wavePath(470, 7)} fill="var(--sea-deep)" opacity="0.45" />
      <NeighborIsland x={304} y={489} />
      <PaperBoat x={286} y={557} scale={1.2} />
      <House />
      <SharedIsland x={146} y={487} />
      <FeelingsSign />
      <SulkCloud />
      {islandPlaces.filter((p) => p.id === 'garden' || p.id === 'lantern').map((place) => (
        <BuildingSpot key={place.id} x={place.x} y={place.y} place={place.id} />
      ))}
    </svg>
  )
}
