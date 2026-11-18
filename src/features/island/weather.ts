import type { IslandSulk } from './islandRepository'

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'rainbow'

/** The heaviest active cloud sets the island weather; each comfort softens it. */
export function weatherForSulks(sulks: IslandSulk[], now = Date.now()): Weather {
  const strength: Record<IslandSulk['level'], number> = { cloudy: 1, rain: 2, storm: 3 }
  const remaining = sulks.reduce((max, sulk) => {
    if (!sulk.startedAt || sulk.endedAt || now - sulk.startedAt.getTime() >= 24 * 3_600_000) return max
    return Math.max(max, Math.max(0, strength[sulk.level] - sulk.comfortCount))
  }, 0)
  if (remaining >= 3) return 'storm'
  if (remaining === 2) return 'rain'
  if (remaining === 1) return 'cloudy'
  return 'sunny'
}
