import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { ClockProvider } from '../../core/clock'
import { MochiHouseScreen } from './MochiHouseScreen'

// Petting must never touch Firestore: Mochi's mood would reveal activity.
const firestoreCalls = vi.hoisted(() => ({ count: 0 }))
vi.mock('firebase/firestore', () => {
  const spy = () => {
    firestoreCalls.count++
  }
  return { doc: spy, setDoc: spy, updateDoc: spy, addDoc: spy, collection: spy, writeBatch: spy }
})

// 12:00 Myanmar time.
const noon = Date.UTC(2026, 10, 10, 5, 30)

function renderHouse(now = noon) {
  render(
    <MemoryRouter>
      <ClockProvider clock={() => now}>
        <MochiHouseScreen />
      </ClockProvider>
    </MemoryRouter>,
  )
}

describe('MochiHouseScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    firestoreCalls.count = 0
  })

  it('shows an idle Mochi in the daytime', () => {
    renderHouse()
    expect(screen.getByRole('img', { name: copy.mochi.label.idle })).toBeInTheDocument()
  })

  it('shows a sleepy Mochi late at night', () => {
    renderHouse(Date.UTC(2026, 10, 10, 18, 0)) // 00:30 Myanmar time
    expect(screen.getByRole('img', { name: copy.mochi.label.sleepy })).toBeInTheDocument()
  })

  it('makes Mochi happy when petted, and remembers it on this device only', async () => {
    renderHouse()
    await userEvent.click(screen.getByRole('button', { name: copy.house.pet }))
    expect(screen.getByRole('img', { name: copy.mochi.label.happy })).toBeInTheDocument()
    expect(screen.getByText(copy.house.saidAfterPet)).toBeInTheDocument()
    expect(localStorage.getItem('mochi.lastPetted')).toBe(String(noon))
    expect(firestoreCalls.count).toBe(0)
  })

  it('makes Mochi happy when fed', async () => {
    renderHouse()
    await userEvent.click(screen.getByRole('button', { name: copy.house.feed }))
    expect(screen.getByRole('img', { name: copy.mochi.label.happy })).toBeInTheDocument()
    expect(screen.getByText(copy.house.saidAfterFeed)).toBeInTheDocument()
    expect(firestoreCalls.count).toBe(0)
  })

  it('has a way back to the island', () => {
    renderHouse()
    expect(screen.getByRole('button', { name: copy.island.back })).toBeInTheDocument()
  })
})
