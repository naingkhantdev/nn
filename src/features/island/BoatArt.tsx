import type { ReactNode } from 'react'

export function BoatArt({ children }: { children?: ReactNode }) {
  return (
          <g>
            <g stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M13 99q17 -5 33 0t34 0t34 0" fill="none" stroke="var(--foam)" />
              <path d="M90 77V9" fill="none" />
              <path d="M93 15Q119 31 124 60H93Z" fill="var(--cream)" />
              <path d="M95 29q11 7 21 22" fill="none" stroke="var(--sand)" strokeWidth="2" />
              <path d="M87 22 68 61H87Z" fill="var(--accent)" />
              <path d="M90 10V4l13 4 -13 5" fill="var(--sun)" strokeWidth="1.3" />
              <path d="M18 77Q63 66 124 76L112 86H31Z" fill="var(--sand)" />
            </g>
            <g transform="translate(27 30)">
              {children}
            </g>
            <g stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M12 76Q67 88 129 74Q122 102 100 103H43Q22 102 12 76Z" fill="var(--cream)" />
              <path d="M25 90Q70 104 117 87" fill="none" stroke="var(--sea-deep)" strokeWidth="3" />
              <path d="M26 81Q69 94 116 80" fill="none" stroke="var(--sand)" strokeWidth="1.2" />
              <path d="m44 85 4 7 5 -6 m7 2 5 7 5 -7 m8 -1 5 7 4 -8" fill="var(--accent)" strokeWidth="1" />
              <circle cx="107" cy="90" r="6" fill="var(--blush)" strokeWidth="1.3" />
              <circle cx="107" cy="90" r="2.7" fill="var(--cream)" strokeWidth="1" />
            </g>
          </g>
  )
}
