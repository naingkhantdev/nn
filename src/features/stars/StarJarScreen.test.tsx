import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { ServicesProvider } from '../../core/services'
import type { ShakeDetector } from '../../platform/shake'
import { fakeStarRepository, openedState, receivedStars } from '../../testing/fakeStars'
import type { Star } from './star'
import type { StarRepository } from './starRepository'
import { SendFailed } from './starRepository'
import { StarJarScreen } from './StarJarScreen'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

const star = (id: string, text: string, hasPhoto = false, day = 10): Star => ({
  id,
  fromUid: 'owner',
  toUid: 'her',
  text,
  hasPhoto,
  createdAt: new Date(2026, 10, day),
})

function fakeShake(granted = true): ShakeDetector & { shake: () => void } {
  let listener: (() => void) | null = null
  return {
    supported: true,
    needsPermission: true,
    requestPermission: vi.fn(async () => granted),
    onShake: (cb) => {
      listener = cb
      return () => {
        listener = null
      }
    },
    shake: () => listener?.(),
  }
}

function renderJar(stars: StarRepository, shake = fakeShake()) {
  render(
    <MemoryRouter initialEntries={['/place/starJar']}>
      <ServicesProvider services={{ stars }}>
        <Routes>
          <Route path="/place/starJar" element={<StarJarScreen shake={shake} />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </ServicesProvider>
    </MemoryRouter>,
  )
  return shake
}

const jar = () => screen.getByRole('button', { name: copy.stars.jarLabel })

describe('StarJarScreen: opening', () => {
  it('tapping the jar opens the oldest unopened star, without asking for motion permission', async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('new', 'Newer', false, 9), star('old', 'Oldest first', false, 2)]),
      openToday: vi.fn(async () => 'opened' as const),
    })
    const shake = renderJar(stars)
    await userEvent.click(jar())
    expect(stars.openToday).toHaveBeenCalledWith(expect.objectContaining({ id: 'old' }))
    expect(await screen.findByText('Oldest first')).toBeInTheDocument()
    expect(shake.requestPermission).not.toHaveBeenCalled()
  })

  it('a refused open says "come back tomorrow", not an error', async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Hi')]),
      openToday: vi.fn(async () => 'alreadyOpenedToday' as const),
    })
    renderJar(stars)
    await userEvent.click(jar())
    expect(await screen.findByText(copy.stars.comeBackTomorrow)).toBeInTheDocument()
    expect(screen.queryByText('Hi')).toBeNull()
  })

  it('a network failure says so calmly', async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Hi')]),
      openToday: vi.fn(async () => {
        throw new SendFailed('offline')
      }),
    })
    renderJar(stars)
    await userEvent.click(jar())
    expect(await screen.findByText(copy.stars.offline)).toBeInTheDocument()
  })

  it('an empty jar writes nothing and sends nothing', async () => {
    const stars = fakeStarRepository({ openToday: vi.fn(), send: vi.fn() })
    renderJar(stars)
    expect(screen.getByText(copy.stars.jarEmpty)).toBeInTheDocument()
    await userEvent.click(jar())
    expect(stars.openToday).not.toHaveBeenCalled()
    expect(stars.send).not.toHaveBeenCalled()
  })

  it("shows when today's star is already out", async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Hi')]),
      watchOpened: openedState({ opened: new Set(), doneToday: true }),
      openToday: vi.fn(),
    })
    renderJar(stars)
    expect(screen.getByText(copy.stars.jarDoneToday)).toBeInTheDocument()
    await userEvent.click(jar())
    expect(stars.openToday).not.toHaveBeenCalled()
  })

  it('shake mode asks permission from a tap, then a shake opens a star', async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Shaken out')]),
      openToday: vi.fn(async () => 'opened' as const),
    })
    const shake = renderJar(stars)
    await userEvent.click(screen.getByRole('button', { name: copy.stars.shakeMode }))
    expect(shake.requestPermission).toHaveBeenCalledTimes(1)
    shake.shake()
    expect(await screen.findByText('Shaken out')).toBeInTheDocument()
  })

  it('denying shake leaves tapping working', async () => {
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('a', 'Tapped out')]),
      openToday: vi.fn(async () => 'opened' as const),
    })
    renderJar(stars, fakeShake(false))
    await userEvent.click(screen.getByRole('button', { name: copy.stars.shakeMode }))
    expect(screen.getByText(copy.stars.shakeDenied)).toBeInTheDocument()
    await userEvent.click(jar())
    expect(await screen.findByText('Tapped out')).toBeInTheDocument()
  })

  it('loads the photo only when the star is opened', async () => {
    const loadPhoto = vi.fn(async () => new Uint8Array([1]))
    const stars = fakeStarRepository({
      watchReceived: receivedStars([star('p', 'Look', true)]),
      openToday: vi.fn(async () => 'opened' as const),
      loadPhoto,
    })
    renderJar(stars)
    expect(loadPhoto).not.toHaveBeenCalled()
    await userEvent.click(jar())
    await screen.findByText('Look')
    expect(loadPhoto).toHaveBeenCalledWith('p')
  })
})

describe('StarJarScreen: writing', () => {
  it('lists the stars I wrote, with no opened information', () => {
    const stars = fakeStarRepository({
      watchWritten: receivedStars([
        { ...star('1', 'First star'), fromUid: 'her', toUid: 'owner' },
        { ...star('2', '', true), fromUid: 'her', toUid: 'owner' },
      ]),
    })
    renderJar(stars)
    const list = screen.getByRole('list')
    expect(within(list).getByText('First star')).toBeInTheDocument()
    expect(within(list).getByText(copy.stars.withPhoto)).toBeInTheDocument()
    expect(within(list).queryByText(/opened|unread|read|seen|left/i)).toBeNull()
  })

  it('shows a kind empty state', () => {
    renderJar(fakeStarRepository())
    expect(screen.getByText(copy.stars.writtenEmpty)).toBeInTheDocument()
  })

  it('goes to the write screen and to keepsakes', async () => {
    renderJar(fakeStarRepository())
    await userEvent.click(screen.getByRole('button', { name: copy.stars.writeStar }))
    expect(screen.getByTestId('where')).toHaveTextContent('/stars/write')
  })
})
