import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { IslandScreen } from './IslandScreen'
import { ServicesProvider, type Services } from '../../core/services'
import {
  fakeFeelingRepository,
  fakePushService,
  fakeServices,
  feelingDoc,
  treatList,
} from '../../testing/fakeServices'
import { islandPlaces, isOpen } from './places'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderIsland(features: Features = { sulkEnabled: false }, services: Services = fakeServices()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <ServicesProvider services={services}>
      <Routes>
        <Route path="/" element={<IslandScreen features={features} />} />
        <Route path="*" element={<Where />} />
      </Routes>
      </ServicesProvider>
    </MemoryRouter>,
  )
}

const placeButton = (place: keyof typeof copy.places) =>
  screen.getByRole('button', { name: copy.places[place] })

describe('isOpen', () => {
  it('opens every illustrated place', () => {
    const off = { sulkEnabled: false }
    const on = { sulkEnabled: true }
    expect(isOpen('mochiHouse', off)).toBe(true)
    expect(isOpen('starJar', off)).toBe(true)
    expect(isOpen('feelings', off)).toBe(true)
    expect(isOpen('sulkCloud', off)).toBe(false)
    expect(isOpen('sulkCloud', on)).toBe(true)
    for (const place of ['snailPost', 'lantern', 'garden', 'bottle'] as const) {
      expect(isOpen(place, off)).toBe(true)
    }
  })
})

describe('IslandScreen', () => {
  it("goes to Mochi's house when tapped", async () => {
    renderIsland()
    await userEvent.click(placeButton('mochiHouse'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/mochiHouse')
  })

  it("opens the friend's island when its button is tapped", async () => {
    renderIsland()
    await userEvent.click(screen.getByRole('button', { name: copy.visitIsland(copy.island.noe) }))
    expect(screen.getByTestId('where')).toHaveTextContent('/visit')
  })

  it('goes to the Star Jar when tapped', async () => {
    renderIsland()
    await userEvent.click(placeButton('starJar'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/starJar')
  })

  it('shows the building message when sulk is off', async () => {
    renderIsland({ sulkEnabled: false })
    await userEvent.click(placeButton('sulkCloud'))
    expect(screen.getByRole('heading', { name: copy.island.stillBuildingTitle })).toBeInTheDocument()
  })

  it('opens the sulk cloud when sulk is on', async () => {
    renderIsland({ sulkEnabled: true })
    await userEvent.click(placeButton('sulkCloud'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/sulkCloud')
  })

  it.each(['snailPost', 'lantern', 'garden', 'bottle'] as const)('opens %s when tapped', async (place) => {
    renderIsland({ sulkEnabled: true })
    await userEvent.click(placeButton(place))
    expect(screen.getByTestId('where')).toHaveTextContent(`/place/${place}`)
  })

  it('gives every place a label and a tap target of at least 48x48', () => {
    renderIsland()
    for (const place of islandPlaces) {
      const button = placeButton(place.id)
      expect(parseFloat(button.style.width)).toBeGreaterThanOrEqual(48)
      expect(parseFloat(button.style.height)).toBeGreaterThanOrEqual(48)
    }
  })

  it('has a Settings entry', async () => {
    renderIsland()
    await userEvent.click(screen.getByRole('button', { name: copy.island.settings }))
    expect(screen.getByTestId('where')).toHaveTextContent('/settings')
  })

  it("shows the other Mochi's shared feeling, with no time", () => {
    renderIsland(
      { sulkEnabled: false },
      fakeServices({ feelings: fakeFeelingRepository({ watchOther: feelingDoc({ feeling: 'sleepy', setAt: null }) }) }),
    )
    expect(screen.getByRole('img', { name: copy.island.friendFeeling('sleepy') })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: copy.island.youMochi })).toBeInTheDocument()
  })

  it('shows the friend Mochi without a shared feeling', () => {
    renderIsland()
    expect(screen.getByRole('img', { name: copy.island.friendMochi })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: copy.island.youMochi })).toBeInTheDocument()
  })

  it('a treat arrives once, and saying thanks deletes it', async () => {
    const dismissTreat = vi.fn()
    renderIsland(
      { sulkEnabled: false },
      fakeServices({
        feelings: fakeFeelingRepository({ watchTreats: treatList([{ id: 't1', kind: 'blanket' }]), dismissTreat }),
      }),
    )
    expect(screen.getByText(copy.treats.arrived.blanket)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: copy.treats.thanks }))
    expect(dismissTreat).toHaveBeenCalledWith('t1')
    expect(screen.queryByText(copy.treats.arrived.blanket)).toBeNull()
  })

  it("offers notifications on the island when they're possible but off", () => {
    renderIsland({ sulkEnabled: false }, fakeServices({ push: fakePushService('off') }))
    expect(screen.getByRole('dialog', { name: copy.push.title })).toBeInTheDocument()
  })

  it('a treat waits until the notification offer is answered', () => {
    renderIsland(
      { sulkEnabled: false },
      fakeServices({
        push: fakePushService('off'),
        feelings: fakeFeelingRepository({ watchTreats: treatList([{ id: 't1', kind: 'hug' }]) }),
      }),
    )
    expect(screen.queryByText(copy.treats.arrived.hug)).toBeNull()
  })
})
