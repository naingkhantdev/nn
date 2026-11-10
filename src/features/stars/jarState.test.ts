import { describe, expect, it } from 'vitest'
import { jarStateFor, keepsakesFrom } from './jarState'
import type { Star } from './star'

const star = (id: string, day: number | null): Star => ({
  id,
  fromUid: 'owner',
  toUid: 'her',
  text: id,
  hasPhoto: false,
  createdAt: day === null ? null : new Date(2026, 10, day),
})

describe('jarStateFor', () => {
  it('gives the oldest unopened star', () => {
    const state = jarStateFor([star('c', 3), star('a', 1), star('b', 2)], new Set(['a']), false)
    expect(state).toEqual({ kind: 'ready', next: star('b', 2) })
  })

  it('puts a not-yet-stamped star last', () => {
    const state = jarStateFor([star('new', null), star('old', 5)], new Set(), false)
    expect(state.kind === 'ready' && state.next.id).toBe('old')
  })

  it('is empty when nothing is left', () => {
    expect(jarStateFor([], new Set(), false)).toEqual({ kind: 'empty' })
    expect(jarStateFor([star('a', 1)], new Set(['a']), false)).toEqual({ kind: 'empty' })
  })

  it('is done for today once today’s star is opened', () => {
    expect(jarStateFor([star('a', 1)], new Set(), true)).toEqual({ kind: 'doneToday' })
  })
})

describe('keepsakesFrom', () => {
  it('lists only opened stars, newest first', () => {
    const list = keepsakesFrom([star('a', 1), star('b', 2), star('c', 3)], new Set(['a', 'c']))
    expect(list.map((s) => s.id)).toEqual(['c', 'a'])
  })
})
