import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { ClockProvider } from '../../core/clock'
import { ServicesProvider } from '../../core/services'
import { fakeFeelingRepository, fakeServices, feelingDoc } from '../../testing/fakeServices'
import type { FeelingRepository } from './feelingRepository'
import { FeelingsScreen } from './FeelingsScreen'

const now = Date.UTC(2026, 10, 10, 6, 0)

function renderFeelings(feelings: FeelingRepository) {
  render(
    <MemoryRouter>
      <ClockProvider clock={() => now}>
        <ServicesProvider services={fakeServices({ feelings })}>
          <FeelingsScreen />
        </ServicesProvider>
      </ClockProvider>
    </MemoryRouter>,
  )
}

describe('FeelingsScreen', () => {
  it('picking a feeling sets it', async () => {
    const repo = fakeFeelingRepository({ set: vi.fn() })
    renderFeelings(repo)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(copy.feelings.label.sleepy) }))
    expect(repo.set).toHaveBeenCalledWith('sleepy')
  })

  it('"nothing right now" clears it', async () => {
    const repo = fakeFeelingRepository({ clear: vi.fn(), watchMine: feelingDoc({ feeling: 'happy', setAt: new Date(now) }) })
    renderFeelings(repo)
    expect(screen.getByRole('button', { name: new RegExp(copy.feelings.label.happy) })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: copy.feelings.nothing }))
    expect(repo.clear).toHaveBeenCalled()
  })

  it("shows the other person's feeling with the matching treat, and no time", async () => {
    const repo = fakeFeelingRepository({
      sendTreat: vi.fn().mockResolvedValue(undefined),
      watchOther: feelingDoc({ feeling: 'sleepy', setAt: new Date(now - 3 * 3_600_000) }),
    })
    renderFeelings(repo)
    const section = screen.getByRole('region', { name: copy.feelings.otherTitle })
    expect(section).toHaveTextContent(copy.feelings.label.sleepy)
    expect(section.textContent).not.toMatch(/\d|ago|hour|minute|am|pm/i)

    await userEvent.click(screen.getByRole('button', { name: copy.feelings.sendTreat.blanket }))
    expect(repo.sendTreat).toHaveBeenCalledWith('blanket')
    expect(await screen.findByText(copy.feelings.treatSent)).toBeInTheDocument()
  })

  it('hides a feeling that has faded', () => {
    renderFeelings(
      fakeFeelingRepository({ watchOther: feelingDoc({ feeling: 'hungry', setAt: new Date(now - 8 * 3_600_000) }) }),
    )
    expect(screen.getByText(copy.feelings.otherNone)).toBeInTheDocument()
  })

  it('a failed treat says so kindly', async () => {
    renderFeelings(
      fakeFeelingRepository({
        sendTreat: vi.fn().mockRejectedValue(new Error('offline')),
        watchOther: feelingDoc({ feeling: 'hungry', setAt: new Date(now) }),
      }),
    )
    await userEvent.click(screen.getByRole('button', { name: copy.feelings.sendTreat.snack }))
    expect(await screen.findByText(copy.feelings.treatFailed)).toBeInTheDocument()
  })
})
