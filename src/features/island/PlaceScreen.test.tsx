import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { PlaceScreen } from './PlaceScreen'
import { ServicesProvider } from '../../core/services'
import { fakeServices } from '../../testing/fakeServices'

function renderAt(path: string, features: Features = { sulkEnabled: false }) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ServicesProvider services={fakeServices()}>
      <Routes>
        <Route path="/" element={<p>island home</p>} />
        <Route path="/place/:id" element={<PlaceScreen features={features} />} />
      </Routes>
      </ServicesProvider>
    </MemoryRouter>,
  )
}

describe('PlaceScreen', () => {
  it('shows the working sulk cloud screen', () => {
    renderAt('/place/sulkCloud', { sulkEnabled: true })
    expect(screen.getByRole('heading', { name: copy.placesUi.sulkTitle })).toBeInTheDocument()
    expect(screen.getByText(copy.placesUi.sulkIntro)).toBeInTheDocument()
  })

  it('opens the garden screen', () => {
    renderAt('/place/garden')
    expect(screen.getByRole('heading', { name: copy.placesUi.gardenTitle })).toBeInTheDocument()
  })

  it('keeps the sulk cloud available when sulk is off', () => {
    renderAt('/place/sulkCloud')
    expect(screen.getByRole('heading', { name: copy.placesUi.sulkTitle })).toBeInTheDocument()
  })

  it('sends unknown places back to the island', () => {
    renderAt('/place/nowhere')
    expect(screen.getByText('island home')).toBeInTheDocument()
  })
})
