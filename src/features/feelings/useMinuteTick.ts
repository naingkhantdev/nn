import { useEffect, useState } from 'react'

/** Re-render once a minute so things that fade (feelings, moods) update. */
export function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
}
