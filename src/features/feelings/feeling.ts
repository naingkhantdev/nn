import { feelingFade } from '../../core/time'
import type { MochiExpression } from '../mochi/Mochi'

export const feelings = ['sleepy', 'hungry', 'happy', 'tired', 'bored', 'missingHome'] as const
export type Feeling = (typeof feelings)[number]

export const activities = ['teaching', 'resting', 'playing', 'eating', 'meeting', 'coding', 'music', 'studying'] as const
export type Activity = (typeof activities)[number]

export const treatKinds = ['snack', 'blanket', 'hug', 'sweet', 'sticker'] as const
export type TreatKind = (typeof treatKinds)[number]

export interface FeelingDoc {
  feeling: Feeling
  /** null while the server has not stamped a fresh local write yet. */
  setAt: Date | null
}

export interface ActivityDoc {
  activity: Activity
  setAt: Date | null
}

export interface Treat {
  id: string
  kind: TreatKind
}

export const FEELING_FADE_MS = feelingFade

export function isFeeling(value: unknown): value is Feeling {
  return typeof value === 'string' && (feelings as readonly string[]).includes(value)
}

export function isTreatKind(value: unknown): value is TreatKind {
  return typeof value === 'string' && (treatKinds as readonly string[]).includes(value)
}

/** The feeling still showing at `now`, or null once 8 hours have passed. */
export function activeFeeling(doc: FeelingDoc | null, now: number): Feeling | null {
  if (!doc) return null
  if (doc.setAt === null) return doc.feeling // just set on this phone
  return now - doc.setAt.getTime() < FEELING_FADE_MS ? doc.feeling : null
}

export function isActivity(value: unknown): value is Activity {
  return typeof value === 'string' && (activities as readonly string[]).includes(value)
}

export function activeActivity(doc: ActivityDoc | null, now: number): Activity | null {
  if (!doc) return null
  if (doc.setAt === null) return doc.activity
  return now - doc.setAt.getTime() < FEELING_FADE_MS ? doc.activity : null
}

const activityExpressions: Record<Activity, MochiExpression> = {
  teaching: 'happy',
  resting: 'sleepy',
  playing: 'dancing',
  eating: 'hungry',
  meeting: 'idle',
  coding: 'happy',
  music: 'dancing',
  studying: 'tired',
}

export function expressionForActivity(activity: Activity): MochiExpression {
  return activityExpressions[activity]
}

const expressions: Record<Feeling, MochiExpression> = {
  sleepy: 'sleepy',
  hungry: 'hungry',
  happy: 'happy',
  tired: 'tired',
  bored: 'bored',
  missingHome: 'homesick',
}

export function expressionFor(feeling: Feeling): MochiExpression {
  return expressions[feeling]
}

const treats: Record<Feeling, TreatKind> = {
  hungry: 'snack',
  sleepy: 'blanket',
  tired: 'hug',
  missingHome: 'hug',
  bored: 'sweet',
  happy: 'sticker',
}

export function treatFor(feeling: Feeling): TreatKind {
  return treats[feeling]
}
