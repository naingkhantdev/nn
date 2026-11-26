import { useId } from 'react'

/** Swells get wider and farther apart toward the viewer. */
export function SeaSurface({ width, height, horizon }: { width: number; height: number; horizon: number }) {
  const id = useId()
  return (
    <g data-sea="true" className="sea-surface">
      <defs>
        <clipPath id={id}><rect y={horizon} width={width} height={height - horizon} /></clipPath>
        <linearGradient id={`${id}-crest`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--foam)" stopOpacity=".4" />
          <stop offset=".3" stopColor="var(--foam)" stopOpacity=".12" />
          <stop offset="1" stopColor="var(--sea-deep)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: 13 }, (_, row) => {
          const depth = (row + 1) / 13
          const y = horizon + depth ** 1.8 * (height - horizon) + Math.sin(row * 4) * depth * 5
          const spacing = width * (.06 + depth * .17)
          const rise = 1 + depth * height * .008
          return (
            <g key={row} className="sea-swell" style={{ animationDelay: `${-row * 1.7}s`, animationDuration: `${7 + row % 4}s` }}>
              {Array.from({ length: 8 }, (_, column) => {
                const span = spacing * (.55 + ((row * 7 + column * 3) % 9) / 10)
                const x = column * width / 6 - width / 6 + Math.sin(row * 3 + column) * spacing * .4
                const crestY = y + Math.sin(row * 2 + column * 5) * depth * height * .012
                const crest = `M${x} ${crestY}q${span * .24} ${-rise} ${span * .5} ${-rise * .4}t${span * .5} ${rise * .4}`
                return (
                  <g key={column} opacity={.4 + ((row + column * 3) % 5) * .1}>
                    <path d={`${crest}l${-span * .12} ${rise * 3}q${-span * .5} ${rise} ${-span * .88} ${-rise * 3}Z`} fill={`url(#${id}-crest)`} />
                    <path d={crest} transform={`translate(0 ${rise * 2})`} fill="none" stroke="var(--sea-deep)" strokeWidth={1 + depth * 2} opacity=".15" />
                    {(row + column) % 3 !== 0 && <path d={crest} fill="none" stroke="var(--foam)" strokeWidth={.3 + depth * .7} opacity=".65" strokeLinecap="round" />}
                  </g>
                )
              })}
            </g>
          )
        })}
      </g>
    </g>
  )
}
