import type { Weather } from './weather'

export const weathers: readonly Weather[] = ['sunny', 'cloudy', 'rain', 'storm', 'rainbow']

function Cloud({ x, y, scale = 1, tone = 'var(--cloud)' }: { x: number; y: number; scale?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={tone}>
      <ellipse cx="0" cy="0" rx="34" ry="16" />
      <circle cx="-14" cy="-10" r="14" />
      <circle cx="10" cy="-14" r="18" />
    </g>
  )
}

function Rain({ heavy }: { heavy: boolean }) {
  const drops = []
  const count = heavy ? 28 : 16
  for (let i = 0; i < count; i++) {
    const x = (i * 137) % 360
    const y = 60 + ((i * 89) % 220)
    drops.push(<line key={i} x1={x} y1={y} x2={x - 4} y2={y + 14} />)
  }
  return (
    <g className="weather-rain" stroke="var(--sky-deep)" strokeWidth="2.4" strokeLinecap="round">
      {drops}
    </g>
  )
}

/** Sky overlay drawn inside the island SVG (scene units 360x640). */
export function WeatherLayer({ weather }: { weather: Weather }) {
  return (
    <g data-weather={weather} aria-hidden="true">
      {weather === 'sunny' && (
        <g transform="translate(62 82)">
          <g className="weather-sun-rays" stroke="var(--sun)" strokeWidth="4" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="0" y1="-38" x2="0" y2="-48" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="28" fill="var(--sun)" />
        </g>
      )}

      {(weather === 'cloudy' || weather === 'rain') && (
        <g className="weather-clouds-drift">
          <Cloud x={110} y={70} scale={1.2} tone="#e6eef1" />
          <Cloud x={240} y={60} scale={1.1} tone="#e6eef1" />
        </g>
      )}

      {weather === 'rain' && <Rain heavy={false} />}

      {weather === 'storm' && (
        <>
          <rect className="weather-flash" width="360" height="330" fill="#ffffff" />
          <g>
            <Cloud x={90} y={70} scale={1.4} tone="#9aa8b1" />
            <Cloud x={200} y={55} scale={1.5} tone="#8a97a0" />
            <Cloud x={310} y={75} scale={1.3} tone="#9aa8b1" />
          </g>
          <Rain heavy />
        </>
      )}

      {weather === 'rainbow' && (
        <g fill="none" strokeWidth="9" opacity="0.85" transform="translate(180 300)">
          <path d="M-150 0 A150 150 0 0 1 150 0" stroke="#f7a1a1" />
          <path d="M-141 0 A141 141 0 0 1 141 0" stroke="#ffd36e" />
          <path d="M-132 0 A132 132 0 0 1 132 0" stroke="#a8d5a2" />
          <path d="M-123 0 A123 123 0 0 1 123 0" stroke="#a9d8e8" />
          <path d="M-114 0 A114 114 0 0 1 114 0" stroke="#c9b3f0" />
        </g>
      )}
    </g>
  )
}
