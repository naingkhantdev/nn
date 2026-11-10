// Shake to open a star. Tap always works too; shake is a bonus.
// iPhone asks for motion permission, and only from a tap on a clear button.

export const SHAKE_THRESHOLD = 15 // m/s², gravity removed
export const SHAKE_WINDOW_MS = 800

/** Fires when two strong jolts land within the window. Pure, for tests. */
export function createShakeCounter(threshold = SHAKE_THRESHOLD, windowMs = SHAKE_WINDOW_MS) {
  let lastJolt: number | null = null
  let quietUntil = 0
  return (magnitude: number, at: number): boolean => {
    if (at < quietUntil || magnitude < threshold) return false
    if (lastJolt !== null && at - lastJolt <= windowMs) {
      lastJolt = null
      quietUntil = at + 1000 // one shake, one star
      return true
    }
    lastJolt = at
    return false
  }
}

type MotionPermission = 'granted' | 'denied'
type MotionEventStatic = { requestPermission?: () => Promise<MotionPermission> }

export interface ShakeDetector {
  supported: boolean
  /** True on iPhone, where a tap must ask for permission first. */
  needsPermission: boolean
  requestPermission(): Promise<boolean>
  onShake(cb: () => void): () => void
}

export function createShakeDetector(): ShakeDetector {
  const MotionEvent = (typeof window !== 'undefined' ? window.DeviceMotionEvent : undefined) as
    | (typeof DeviceMotionEvent & MotionEventStatic)
    | undefined
  const supported = MotionEvent !== undefined
  const needsPermission = typeof MotionEvent?.requestPermission === 'function'

  return {
    supported,
    needsPermission,
    async requestPermission() {
      if (!supported) return false
      if (!needsPermission) return true
      try {
        return (await MotionEvent!.requestPermission!()) === 'granted'
      } catch {
        return false
      }
    },
    onShake(cb) {
      if (!supported) return () => {}
      const counter = createShakeCounter()
      const handler = (e: DeviceMotionEvent) => {
        const a = e.acceleration
        let magnitude: number
        if (a && a.x !== null && a.y !== null && a.z !== null) {
          magnitude = Math.hypot(a.x, a.y, a.z)
        } else {
          const g = e.accelerationIncludingGravity
          if (!g || g.x === null || g.y === null || g.z === null) return
          magnitude = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81)
        }
        if (counter(magnitude, e.timeStamp)) cb()
      }
      window.addEventListener('devicemotion', handler)
      return () => window.removeEventListener('devicemotion', handler)
    },
  }
}
