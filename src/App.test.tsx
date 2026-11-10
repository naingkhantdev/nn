import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ServicesProvider } from './core/services'
import { fakeServices } from './testing/fakeServices'
import { copy } from './copy/copy'
import type { AuthRepository, SessionUser } from './features/auth/authRepository'
import type { InstallEnv } from './platform/install'

const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const iphoneMessenger =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/458.0.0.38.108]'
const androidChrome =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

const env = (userAgent: string, standalone = false): InstallEnv => ({
  userAgent,
  standalone,
  url: 'https://mochi-island-mk.web.app/',
})

function signedOutRepo(): AuthRepository {
  return {
    onSession: (cb: (u: SessionUser | null) => void) => {
      queueMicrotask(() => act(() => cb(null)))
      return () => {}
    },
    watchProfile: () => () => {},
    signIn: vi.fn(),
    changePhrase: vi.fn(),
    reauthenticate: vi.fn(),
    signOut: vi.fn(),
  }
}

function renderApp(installEnv: InstallEnv) {
  render(
    <MemoryRouter>
      <ServicesProvider services={fakeServices()}>
        <App repo={signedOutRepo()} installEnv={installEnv} />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('renders the app root', () => {
    renderApp(env(androidChrome))
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })

  it('other browsers go straight to login', async () => {
    renderApp(env(androidChrome))
    expect(await screen.findByLabelText(copy.auth.usernameLabel)).toBeInTheDocument()
  })

  it('an in-app browser shows the guide before login', () => {
    renderApp(env(iphoneMessenger))
    expect(screen.getByText(copy.install.inAppTitle)).toBeInTheDocument()
    expect(screen.queryByLabelText(copy.auth.usernameLabel)).toBeNull()
  })

  it('iPhone Safari shows the guide, and continuing is remembered', async () => {
    const user = userEvent.setup()
    renderApp(env(iphoneSafari))
    expect(screen.getByText(copy.install.addTitle)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: copy.install.continueHere }))
    expect(await screen.findByLabelText(copy.auth.usernameLabel)).toBeInTheDocument()

    cleanup()
    renderApp(env(iphoneSafari))
    expect(screen.queryByText(copy.install.addTitle)).toBeNull()
  })

  it('the installed app skips the guide', async () => {
    renderApp(env(iphoneSafari, true))
    expect(await screen.findByLabelText(copy.auth.usernameLabel)).toBeInTheDocument()
  })
})
