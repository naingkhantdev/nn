import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { ServicesProvider } from '../../core/services'
import { fakeStarRepository, openedState, receivedStars } from '../../testing/fakeStars'
import { KeepsakesScreen } from './KeepsakesScreen'
import type { Star } from './star'

const star = (id: string, text: string, hasPhoto = false): Star => ({
  id,
  fromUid: 'owner',
  toUid: 'her',
  text,
  hasPhoto,
  createdAt: new Date(2026, 10, 10),
})

describe('KeepsakesScreen', () => {
  it('keeps only opened stars, and loads a photo only when tapped', async () => {
    const loadPhoto = vi.fn(async () => new Uint8Array([1]))
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Opened one', true), star('b', 'Still in the jar')]),
      watchOpened: openedState({ opened: new Set(['a']), doneToday: true }),
      loadPhoto,
    })
    render(
      <MemoryRouter>
        <ServicesProvider services={{ stars }}>
          <KeepsakesScreen />
        </ServicesProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('Opened one')).toBeInTheDocument()
    expect(screen.queryByText('Still in the jar')).toBeNull()
    expect(loadPhoto).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: copy.stars.showPhoto }))
    expect(loadPhoto).toHaveBeenCalledWith('a')
  })

  it('shows a kind empty state', () => {
    render(
      <MemoryRouter>
        <ServicesProvider services={{ stars: fakeStarRepository() }}>
          <KeepsakesScreen />
        </ServicesProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText(copy.stars.keepsakesEmpty)).toBeInTheDocument()
  })
})
