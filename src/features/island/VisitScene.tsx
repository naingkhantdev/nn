import { useId } from 'react'
import { SeaSurface } from './SeaSurface'

/** The jetty, boat and characters share a fixed coordinate system. */
export function VisitScene({ campus }: { campus: boolean }) {
  const sunId = useId()
  return (
    <svg viewBox="0 0 400 500" aria-hidden="true" className="campus-scene">
      <defs>
        <radialGradient id={sunId} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="var(--cream)" />
          <stop offset=".5" stopColor="var(--sun)" />
          <stop offset="1" stopColor="var(--blush)" />
        </radialGradient>
        <linearGradient id={sunId + '-sea'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-deep)" />
          <stop offset=".35" stopColor="var(--sea)" />
          <stop offset="1" stopColor="var(--sea-deep)" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="var(--sky)" />
      {!campus && <g>
        <path d="M0 104 Q90 88 166 109 T320 107 T400 96 V162 H0Z" fill="var(--cream)" />
        <path d="M0 132 Q90 111 180 132 T400 123 V158 H0Z" fill="var(--blush)" />
        <path d="m165 92 q6 -4 10 2 q4 -6 11 -6 m41 17 q4 -3 8 1 q4 -4 8 -4" fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
      </g>}
      <circle className="island-sun-halo" cx="326" cy="116" r="38" fill="var(--sun)" opacity=".15" />
      <circle cx="326" cy="116" r="29" fill={`url(#${sunId})`} />
      <g className="island-birds" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M110 82q7 -6 13 0q6 -6 13 -5" />
        <path d="M160 65q5 -5 10 0q5 -5 10 -3" />
        <path d="M203 91q5 -5 10 0q5 -5 10 -3" />
      </g>
      <path data-sea="true" d="M0 153 Q70 148 140 153 T280 153 T420 153 V500 H0Z" fill={`url(#${sunId}-sea)`} />
      <g data-sea="true" className="island-sun-reflection" fill="none" stroke="var(--cream)" strokeLinecap="round" opacity=".65">
        <path d="M312 158h28m-36 7h41m-28 8h22m-42 9h53m-38 10h23" strokeWidth="2.5" />
      </g>
      <g data-sea="true" className="island-horizon-wave" fill="none" stroke="var(--foam)" strokeWidth="1.5" opacity=".5">
        <path d="M-20 158q40 -6 80 0t80 0t80 0t80 0t120 0 M-20 171q40 -6 80 0t80 0t80 0t80 0t120 0" />
      </g>
      <SeaSurface width={400} height={500} horizon={153} />
      <ellipse cx="200" cy="320" rx="203" ry="74" fill="var(--sky-deep)" opacity=".22" />
      <ellipse className="home-shore-surf" data-sea="true" cx="200" cy="320" rx="196" ry="67" fill="none" stroke="var(--foam)" strokeWidth="3" opacity=".65" />
      <PersonalIslandArt campus={campus} />
      <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
        <path d="m135 331 -47 65 22 7 54 -66Z" fill="var(--sand)" />
        <path d="m120 354 25 7 m-36 9 24 7 m-35 8 24 7" fill="none" />
        <path d="M94 412q13 -4 13 -17" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" />
      </g>
    </svg>
  )
}

export function PersonalIslandArt({ campus }: { campus: boolean }) {
  return (
    <g>
      <ellipse cx="200" cy="320" rx="194" ry="65" fill="var(--foam)" />
      <ellipse cx="200" cy="313" rx="188" ry="63" fill="var(--sand)" />
      <ellipse cx="200" cy="302" rx="178" ry="58" fill="var(--grass)" />
      <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
        {campus ? <g>
          <path d="M56 282 Q64 245 57 213 M61 252 L43 235" fill="none" stroke="var(--ink-soft)" strokeWidth="7" />
          <path d="M28 237 Q15 221 33 211 Q30 194 48 194 Q61 177 75 195 Q97 195 91 215 Q106 231 84 239 Q64 251 48 238Z" fill="var(--accent)" />
          <path d="M34 216 Q40 210 46 212 M62 202 Q71 198 76 204" fill="none" stroke="var(--cream)" />
        </g> : <g>
          <path d="M307 286 L316 226 H338 L347 286Z" fill="var(--cream)" />
          <path d="M313 245 H341 L343 261 H311Z" fill="var(--sea-deep)" />
          <rect x="315" y="210" width="24" height="18" rx="3" fill="var(--sun)" />
          <path d="M310 210 L327 195 L344 210Z" fill="var(--sea-deep)" />
          <path d="M38 293 Q47 277 56 285 Q68 269 76 295Z" fill="var(--ink-soft)" />
        </g>}
        {campus ? <>
        <rect x="96" y="208" width="210" height="73" rx="12" fill="var(--cream)" />
        <path d="M83 209 L106 183 H295 L319 209Z" fill="var(--accent)" />
        {[113,148,234,269].map(x => <rect key={x} x={x} y="223" width="21" height="27" rx="3" fill="var(--sky-deep)" />)}
        <g>
          <path d="M173 282 V198 L201 172 L229 198 V282Z" fill="var(--sand)" />
          <circle cx="201" cy="207" r="12" fill="var(--cream)" />
          <path d="M201 198 V207 L207 211" fill="none" />
          <path d="M189 280 V252 A12 12 0 0 1 213 252 V280Z" fill="var(--accent-ink)" />
        </g>
        <g strokeLinecap="round" strokeWidth="1.8">
          {/* Climbing leaves and flowers frame the warm clock-tower entrance. */}
          <path d="M171 281 Q163 266 172 253 Q180 242 170 231 M231 282 Q242 262 232 246 Q226 236 235 225" fill="none" stroke="var(--grass-deep)" strokeWidth="3" />
          {[[170,264], [173,244], [234,267], [233,245]].map(([x,y]) => (
            <g key={x + '-' + y} transform={`translate(${x} ${y})`}>
              <path d="M0 0 Q-13 -9 -12 0 Q-9 6 0 0 Q12 -10 12 -2 Q9 5 0 0" fill="var(--grass-deep)" stroke="none" />
              <circle cy="-3" r="4" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="1" />
              <circle cy="-3" r="1.3" fill="var(--sun)" stroke="none" />
            </g>
          ))}
          {[113,148,234,269].map(x => (
            <g key={x}>
              <path d={`M${x+10} 224v24 M${x+1} 236h19`} fill="none" stroke="var(--cream)" strokeWidth="1.6" />
              <path d={`M${x-2} 252h25l-3 7h-19Z`} fill="var(--blush)" />
              <path d={`M${x+2} 251q4 -10 8 -1q4 -9 8 0`} fill="var(--leaf)" stroke="var(--grass-deep)" strokeWidth="1" />
            </g>
          ))}
          {/* A swing and an open book under the flowering tree. */}
          <path d="M42 233v51 M77 232v52" fill="none" stroke="var(--sand)" strokeWidth="2.4" />
          <path d="M36 283q22 7 47 0v6q-24 7 -47 -1Z" fill="var(--sand)" />
          <path d="m43 281 15 -4 15 4 -14 4Z" fill="var(--cream)" />
          <path d="m58 278 1 6" fill="none" stroke="var(--ink-soft)" strokeWidth="1" />
          {/* A small tea table and a patchwork picnic blanket. */}
          <path d="m81 311 32 -8 22 12 -33 9Z" fill="var(--cream)" stroke="var(--accent)" />
          <path d="m89 309 23 13 m-12 -16 24 13 m-37 -4 32 -8 m-24 13 32 -8" stroke="var(--accent)" strokeWidth="1" />
          <ellipse cx="324" cy="309" rx="18" ry="7" fill="var(--sand)" />
          <path d="M312 314v12 M335 314v12" fill="none" />
          <path d="M318 300h10v7q-5 4 -10 0Z M328 301q8 -2 6 4h-6" fill="var(--cream)" />
          <path d="M193 286h18 M183 296h15 M171 306h16 M158 316h16" fill="none" stroke="var(--sand)" strokeWidth="6" />
          <path d="M289 275v-15 M285 260h9l-1 9h-7Z" fill="var(--sun)" strokeWidth="1.3" />
          <path d="M287 261v6" stroke="var(--cream)" strokeWidth="1" />
        </g>
        </> : <HarborStudio />}
        {campus && [[52,283], [68,291], [85,280], [307,282], [324,278], [341,291]].map(([x,y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path d="M0 3 V15 Q-8 14 -9 8 Q-3 7 0 12" fill="var(--leaf)" stroke="var(--grass-deep)" strokeWidth="2" />
            <path d="M0 0 C-10 -9 -12 5 -4 5 C-5 14 6 12 5 5 C15 4 9 -8 3 -3 C4 -11 -4 -11 0 0Z" fill="var(--accent)" strokeWidth="1.4" />
            <circle r="2" fill="var(--sun)" stroke="none" />
          </g>
        ))}
      </g>
    </g>
  )
}

function HarborStudio() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="181" cy="283" rx="91" ry="12" fill="var(--grass-deep)" stroke="none" opacity=".45" />
      {/* Rounded plaster walls, a tiled roof and a small rooftop observatory. */}
      <path d="M118 214 Q117 207 126 205 H218 Q228 207 228 217 V270 Q228 278 220 279 H126 Q118 278 118 270Z" fill="var(--cream)" />
      <path d="M207 217 H228 V270 Q228 278 220 279 H207Z" fill="var(--mochi-shade)" stroke="none" />
      <path d="M177 192 V170 A23 23 0 0 1 223 170 V192Z" fill="var(--sand)" />
      <path d="M172 170 A28 28 0 0 1 228 170Z" fill="var(--sea-deep)" />
      <path d="M187 168 Q188 151 200 142 Q213 152 214 168" fill="none" stroke="var(--foam)" strokeWidth="1.7" />
      <circle cx="200" cy="181" r="6" fill="var(--sky-deep)" strokeWidth="1.8" />
      <path d="M106 216 Q114 201 136 184 Q163 176 184 186 L240 214 Q215 223 174 217 Q133 223 106 216Z" fill="var(--sea-deep)" />
      <path d="m123 207 9 -10 m12 16 8 -19 m12 20 1 -24 m17 23 -5 -19 m22 20 -9 -17 m26 17 -12 -12" fill="none" stroke="var(--foam)" strokeWidth="1.2" opacity=".65" />
      <path d="M130 250 V237 A13 13 0 0 1 156 237 V250Z" fill="var(--sky-deep)" strokeWidth="2" />
      <path d="M143 226 V249 M131 238 H155" fill="none" strokeWidth="1.6" />
      <path d="M172 278 V248 A12 12 0 0 1 196 248 V278Z" fill="var(--sand)" strokeWidth="2" />
      <path d="M177 251 V274 M182 246 V275 M188 247 V275" stroke="var(--ink-soft)" strokeWidth=".8" opacity=".5" />
      <circle cx="190" cy="259" r="1.7" fill="var(--ink)" stroke="none" />
      <rect x="207" y="234" width="12" height="17" rx="5" fill="var(--sun)" strokeWidth="1.8" />
      <path d="M166 280 H202 L207 286 H162Z" fill="var(--sand)" strokeWidth="1.8" />
      <path d="M129 255 H158 L155 263 H132Z" fill="var(--blush)" strokeWidth="1.6" />
      {[134,143,152].map(x => <g key={x}>
        <path d={`M${x} 254v-6`} stroke="var(--grass-deep)" strokeWidth="2" />
        <circle cx={x} cy="247" r="3" fill="var(--accent)" strokeWidth=".9" />
        <circle cx={x} cy="247" r="1" fill="var(--sun)" stroke="none" />
      </g>)}
      <path d="M111 266 Q101 249 109 239 Q120 247 113 265 M110 262 Q94 263 96 253 Q107 250 110 262" fill="var(--grass-deep)" strokeWidth="1.3" />
      <path d="M103 264 H119 L116 277 H106Z" fill="var(--blush)" strokeWidth="1.6" />
      <path d="M170 291 Q160 296 160 302 M151 307 Q143 309 142 313" fill="none" stroke="var(--sand)" strokeWidth="7" />
      <path d="M279 304 Q290 289 301 304 Q310 294 319 309" fill="none" stroke="var(--grass-deep)" strokeWidth="2" />
      <ellipse cx="314" cy="322" rx="8" ry="3" fill="var(--mochi-shade)" strokeWidth="1" />
      <path d="m333 309 3 -4 3 4 -3 4Z" fill="var(--cream)" strokeWidth="1" />
      {/* The telescope and chart table face the open water. */}
      <g transform="translate(62 277)">
        <path d="M0 -17 -12 13 M0 -17 11 13 M0 -17 V16" fill="none" />
        <g transform="rotate(-27 0 -19)">
          <rect x="-15" y="-24" width="34" height="9" rx="2" fill="var(--sand)" />
          <rect x="13" y="-28" width="9" height="17" rx="2" fill="var(--sea-deep)" />
        </g>
      </g>
      <path d="M83 310 116 302 135 309 101 318Z" fill="var(--sand)" />
      <path d="M88 313 V325 M128 313 V322" fill="none" />
      <path d="m93 309 15 -4 10 4 -16 4Z" fill="var(--cream)" strokeWidth="1.3" />
      <path d="M231 215 Q273 239 319 210" fill="none" strokeWidth="1.6" />
      {[[246,222],[263,226],[282,225],[300,219]].map(([x,y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0 0v4" strokeWidth="1.6" />
          <rect x="-3" y="4" width="6" height="8" rx="3" fill="var(--sun)" strokeWidth="1.4" />
        </g>
      ))}
    </g>
  )
}
