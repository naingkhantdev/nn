import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { InstallGuide } from './InstallGuide'

const url = 'https://mochi-island-mk.web.app/'

describe('InstallGuide', () => {
  it('in an in-app browser, offers a copy-link button that copies the link', async () => {
    const user = userEvent.setup()
    render(<InstallGuide advice="inAppBrowser" iosVersion={null} url={url} onContinue={vi.fn()} />)
    expect(screen.getByText(copy.install.inAppTitle)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: copy.install.copyLink }))
    expect(await navigator.clipboard.readText()).toBe(url)
    expect(await screen.findByText(copy.install.copied)).toBeInTheDocument()
  })

  it('in an in-app browser, offers no way to continue there', () => {
    render(<InstallGuide advice="inAppBrowser" iosVersion={null} url={url} onContinue={vi.fn()} />)
    expect(screen.queryByRole('button', { name: copy.install.continueHere })).toBeNull()
  })

  it('on iPhone Safari, shows the Add to Home Screen steps', () => {
    render(
      <InstallGuide advice="iosSafariAddToHome" iosVersion={{ major: 17, minor: 5 }} url={url} onContinue={vi.fn()} />,
    )
    expect(screen.getByText(copy.install.stepShare)).toBeInTheDocument()
    expect(screen.getByText(copy.install.stepAdd)).toBeInTheDocument()
    expect(screen.getByText(copy.install.stepOpen)).toBeInTheDocument()
    expect(screen.queryByText(copy.install.oldIos)).toBeNull()
  })

  it('below iOS 16.4, shows the kind notice and a continue option', async () => {
    const onContinue = vi.fn()
    const user = userEvent.setup()
    render(
      <InstallGuide advice="iosSafariAddToHome" iosVersion={{ major: 16, minor: 3 }} url={url} onContinue={onContinue} />,
    )
    expect(screen.getByText(copy.install.oldIos)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: copy.install.continueHere }))
    expect(onContinue).toHaveBeenCalled()
  })
})
