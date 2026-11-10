import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { IslandScreen } from './IslandScreen'
import { islandPlaces, isOpen } from './places'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderIsland(features: Features = { sulkEnabled: false }) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<IslandScreen features={features} />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

const placeButton = (place: keyof typeof copy.places) =>
  screen.getByRole('button', { name: copy.places[place] })

describe('isOpen', () => {
  it('opens the house, jar, and feelings; gates the sulk cloud; keeps later places closed', () => {
    const off = { sulkEnabled: false }
    const on = { sulkEnabled: true }
    expect(isOpen('mochiHouse', off)).toBe(true)
    expect(isOpen('starJar', off)).toBe(true)
    expect(isOpen('feelings', off)).toBe(true)
    expect(isOpen('sulkCloud', off)).toBe(false)
    expect(isOpen('sulkCloud', on)).toBe(true)
    for (const later of ['snailPost', 'lantern', 'garden', 'bottle'] as const) {
      expect(isOpen(later, on)).toBe(false)
    }
  })
})

describe('IslandScreen', () => {
  it("goes to Mochi's house when tapped", async () => {
    renderIsland()
    await userEvent.click(placeButton('mochiHouse'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/mochiHouse')
  })

  it('goes to the Star Jar when tapped', async () => {
    renderIsland()
    await userEvent.click(placeButton('starJar'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/starJar')
  })

  it('shows "still being built" for the sulk cloud while sulk is off', async () => {
    renderIsland({ sulkEnabled: false })
    await userEvent.click(placeButton('sulkCloud'))
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText(copy.island.stillBuildingTitle)).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: copy.island.stillBuildingOk }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the sulk cloud when sulk is on', async () => {
    renderIsland({ sulkEnabled: true })
    await userEvent.click(placeButton('sulkCloud'))
    expect(screen.getByTestId('where')).toHaveTextContent('/place/sulkCloud')
  })

  it('shows "still being built" for every later place', async () => {
    renderIsland({ sulkEnabled: true })
    for (const later of ['snailPost', 'lantern', 'garden', 'bottle'] as const) {
      await userEvent.click(placeButton(later))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: copy.island.stillBuildingOk }))
    }
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
})
