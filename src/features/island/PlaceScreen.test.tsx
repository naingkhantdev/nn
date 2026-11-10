import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { PlaceScreen } from './PlaceScreen'

function renderAt(path: string, features: Features = { sulkEnabled: false }) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>island home</p>} />
        <Route path="/place/:id" element={<PlaceScreen features={features} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlaceScreen', () => {
  it('shows a placeholder for an open place without its own screen yet', () => {
    renderAt('/place/feelings')
    expect(screen.getByText(copy.places.feelings)).toBeInTheDocument()
    expect(screen.getByText(copy.island.roomComingSoon)).toBeInTheDocument()
  })

  it('sends closed places back to the island', () => {
    renderAt('/place/garden')
    expect(screen.getByText('island home')).toBeInTheDocument()
  })

  it('sends the sulk cloud back while sulk is off', () => {
    renderAt('/place/sulkCloud')
    expect(screen.getByText('island home')).toBeInTheDocument()
  })

  it('sends unknown places back to the island', () => {
    renderAt('/place/nowhere')
    expect(screen.getByText('island home')).toBeInTheDocument()
  })
})
