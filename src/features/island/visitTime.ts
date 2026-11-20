import { copy } from '../../copy/copy'

export function formatVisitAge(visitedAt: Date, now: number): string {
  const elapsed = Math.max(0, now - visitedAt.getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return copy.island.visitNow
  if (minutes < 60) return copy.island.visitMinutes(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return copy.island.visitHours(hours)
  return copy.island.visitDays(Math.floor(hours / 24))
}
