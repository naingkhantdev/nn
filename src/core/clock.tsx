import { createContext, useContext, type ReactNode } from 'react'

export type Clock = () => number

const ClockContext = createContext<Clock>(() => Date.now())

/** Lets tests control "now". The server still decides anything that matters. */
export function ClockProvider({ clock, children }: { clock: Clock; children: ReactNode }) {
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>
}

export const useClock = () => useContext(ClockContext)
