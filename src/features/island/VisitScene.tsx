/** The jetty, boat and characters share a fixed coordinate system. */
export function VisitScene({ campus }: { campus: boolean }) {
  return (
    <svg viewBox="0 0 400 500" aria-hidden="true" className="campus-scene">
      <rect width="400" height="500" fill="var(--sky)" />
      <circle cx="326" cy="116" r="29" fill="var(--sun)" />
      <path d="M0 265 Q70 254 140 265 T280 265 T420 265 V500 H0Z" fill="var(--sea)" />
      <ellipse cx="200" cy="320" rx="194" ry="65" fill="var(--foam)" />
      <ellipse cx="200" cy="313" rx="188" ry="63" fill="var(--sand)" />
      <ellipse cx="200" cy="302" rx="178" ry="58" fill="var(--grass)" />
      <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
        <rect x="96" y="208" width="210" height="73" rx="4" fill="var(--cream)" />
        <path d="M83 209 L106 183 H295 L319 209Z" fill={campus ? 'var(--accent)' : 'var(--sea-deep)'} />
        {[113,148,234,269].map(x => <rect key={x} x={x} y="223" width="21" height="27" rx="3" fill="var(--sky-deep)" />)}
        {campus ? <g>
          <path d="M173 282 V198 L201 172 L229 198 V282Z" fill="var(--sand)" />
          <circle cx="201" cy="207" r="12" fill="var(--cream)" />
          <path d="M201 198 V207 L207 211" fill="none" />
          <path d="M189 280 V252 A12 12 0 0 1 213 252 V280Z" fill="var(--accent-ink)" />
        </g> : <g>
          <rect x="177" y="218" width="49" height="36" rx="4" fill="var(--ink)" />
          <path d="m193 228 -7 7 7 6 m15 -13 7 7 -7 6" stroke="var(--leaf)" fill="none" />
        </g>}
        <path d="m135 331 -47 65 22 7 54 -66Z" fill="var(--sand)" />
        <path d="m120 354 25 7 m-36 9 24 7 m-35 8 24 7" fill="none" />
        <g className="campus-boat">
          <path d="M56 413 L117 411 L104 428 H72Z" fill="var(--cream)" />
          <path d="M86 410 V374 L108 401 H86" fill="var(--accent)" />
        </g>
      </g>
    </svg>
  )
}
