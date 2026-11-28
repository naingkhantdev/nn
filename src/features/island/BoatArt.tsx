import type { ReactNode } from 'react'

export function BoatArt({ children }: { children?: ReactNode }) {
  return (
          <g>
            <g stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M13 99q17 -5 33 0t34 0t34 0" fill="none" stroke="var(--foam)" />
              <ellipse cx="70" cy="103" rx="51" ry="5" fill="var(--sea-deep)" opacity=".18" stroke="none" />
              <path d="M90 77V9" fill="none" stroke="var(--sand)" strokeWidth="4" />
              <path d="M90 13 23 77 M91 16 122 76" fill="none" stroke="var(--ink-soft)" strokeWidth="1" />
              <path d="M94 15Q119 30 124 60Q109 57 94 62Z" fill="var(--cream)" />
              <path d="M98 25Q111 37 117 53 M98 59 118 58" fill="none" stroke="var(--sand)" strokeWidth="1.2" />
              <path d="M85 22Q69 38 62 63Q74 59 85 62Z" fill="var(--accent)" />
              <path d="M81 34Q72 47 69 57" fill="none" stroke="var(--blush)" strokeWidth="1.2" />
              <path d="M91 64 124 61" fill="none" stroke="var(--sand)" strokeWidth="3" />
              <path d="M90 10V4l13 4 -13 5" fill="var(--sun)" strokeWidth="1.3" />
              <path d="M18 77Q63 66 124 76L112 86H31Z" fill="var(--sand)" />
              <path d="M27 76Q65 70 113 76L106 82H35Z" fill="var(--accent-ink)" strokeWidth="1" />
              <path d="M40 73 47 82 M61 72 67 82 M82 72 87 81" stroke="var(--sand)" strokeWidth="3" />
            </g>
            <g transform="translate(27 30)">
              {children}
            </g>
            <g stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M12 76Q67 88 129 74Q122 102 100 103H43Q22 102 12 76Z" fill="var(--cream)" />
              <path d="M22 88Q36 104 60 100H99Q110 99 118 91" fill="none" stroke="var(--sand)" strokeWidth="2" />
              <path d="M25 90Q70 104 117 87" fill="none" stroke="var(--sea-deep)" strokeWidth="3" />
              <path d="M26 81Q69 94 116 80" fill="none" stroke="var(--sand)" strokeWidth="1.2" />
              <path d="m44 85 4 7 5 -6 m7 2 5 7 5 -7 m8 -1 5 7 4 -8" fill="var(--accent)" strokeWidth="1" />
              <circle cx="107" cy="90" r="6" fill="var(--blush)" strokeWidth="1.3" />
              <circle cx="107" cy="90" r="2.7" fill="var(--cream)" strokeWidth="1" />
              <path d="M107 84v3 M107 93v3 M101 90h3 M110 90h3" stroke="var(--cream)" strokeWidth="1.8" />
              <circle cx="35" cy="89" r="1.5" fill="var(--ink)" stroke="none" />
              <circle cx="47" cy="91" r="1.5" fill="var(--ink)" stroke="none" />
              <path d="M38 94q3 4 6 0" fill="none" strokeWidth="1.2" />
              <ellipse cx="31" cy="93" rx="3" ry="1.6" fill="var(--blush)" stroke="none" />
            </g>
          </g>
  )
}
