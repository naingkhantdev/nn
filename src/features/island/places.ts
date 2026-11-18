import type { Features } from '../../core/members'

export type IslandPlaceId =
  | 'mochiHouse'
  | 'starJar'
  | 'feelings'
  | 'sulkCloud'
  | 'snailPost'
  | 'lantern'
  | 'garden'
  | 'bottle'

export interface IslandPlace {
  id: IslandPlaceId
  /** Centre of the place in scene units (viewBox 0 0 360 640). */
  x: number
  y: number
}

export const SCENE_WIDTH = 360
export const SCENE_HEIGHT = 640
/** Tap targets stay at least 48x48 CSS px at every screen size. */
export const PLACE_TAP_SIZE = 56

export const islandPlaces: readonly IslandPlace[] = [
  { id: 'mochiHouse', x: 175, y: 330 },
  { id: 'starJar', x: 268, y: 350 },
  { id: 'feelings', x: 88, y: 350 },
  { id: 'sulkCloud', x: 282, y: 128 },
  { id: 'garden', x: 128, y: 410 },
  { id: 'lantern', x: 228, y: 414 },
  { id: 'snailPost', x: 302, y: 418 },
  { id: 'bottle', x: 78, y: 528 },
]

/** Every illustrated island place has a working destination. */
export function isOpen(place: IslandPlaceId, _features: Features): boolean {
  return islandPlaces.some((candidate) => candidate.id === place)
}

export function isPlaceId(value: string | undefined): value is IslandPlaceId {
  return islandPlaces.some((p) => p.id === value)
}
