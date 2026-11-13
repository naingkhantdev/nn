import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import type { PushService, PushState } from '../../platform/push'
import { NotificationPrompt } from './NotificationPrompt'

function fakePush(state: PushState, result: Awaited<ReturnType<PushService['enable']>> = 'enabled'): PushService {
  return {
    state: () => state,
    enable: vi.fn(async () => result),
    disable: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  }
}

beforeEach(() => localStorage.clear())

describe('NotificationPrompt', () => {
  it("shows Mochi's explanation first and asks nothing until tapped", () => {
    const push = fakePush('off')
    render(<NotificationPrompt push={push} />)
    expect(screen.getByText(copy.push.body)).toBeInTheDocument()
    expect(push.enable).not.toHaveBeenCalled()
  })

  it('tapping yes enables push and closes the prompt', async () => {
    const push = fakePush('off', 'enabled')
    render(<NotificationPrompt push={push} />)
    await userEvent.click(screen.getByRole('button', { name: copy.push.yes }))
    expect(push.enable).toHaveBeenCalled()
    expect(screen.queryByText(copy.push.body)).not.toBeInTheDocument()
  })

  it('a refusal shows the remove-and-re-add note, and the app carries on', async () => {
    render(<NotificationPrompt push={fakePush('off', 'denied')} />)
    await userEvent.click(screen.getByRole('button', { name: copy.push.yes }))
    expect(screen.getByText(copy.push.denied)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: copy.push.ok }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('a failure while enabling is gentle and closable', async () => {
    const push = fakePush('off')
    vi.mocked(push.enable).mockRejectedValueOnce(new Error('no service worker'))
    render(<NotificationPrompt push={push} />)
    await userEvent.click(screen.getByRole('button', { name: copy.push.yes }))
    expect(screen.getByText(copy.push.failed)).toBeInTheDocument()
  })

  it.each<PushState>(['unsupported', 'on', 'denied'])('shows nothing when push is %s', (state) => {
    render(<NotificationPrompt push={fakePush(state)} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is not shown again automatically after "not now"', async () => {
    const push = fakePush('off')
    const { unmount } = render(<NotificationPrompt push={push} />)
    await userEvent.click(screen.getByRole('button', { name: copy.push.notNow }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()

    render(<NotificationPrompt push={push} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(push.enable).not.toHaveBeenCalled()
  })

  it('is not shown again automatically after a refusal', async () => {
    const { unmount } = render(<NotificationPrompt push={fakePush('off', 'denied')} />)
    await userEvent.click(screen.getByRole('button', { name: copy.push.yes }))
    unmount()
    render(<NotificationPrompt push={fakePush('off')} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
