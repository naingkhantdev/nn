import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { AppRoutes } from './AppRoutes'
import { ServicesProvider } from '../../core/services'
import { fakeServices } from '../../testing/fakeServices'
import type { AuthRepository, Profile, SessionUser } from './authRepository'

function fakeRepo() {
  let onSession: ((u: SessionUser | null) => void) | undefined
  let onProfile: ((p: Profile | null) => void) | undefined
  const repo: AuthRepository = {
    onSession: (cb) => {
      onSession = cb
      return () => {}
    },
    watchProfile: (_uid, cb) => {
      onProfile = cb
      return () => {}
    },
    signIn: vi.fn().mockResolvedValue(undefined),
    changePhrase: vi.fn().mockResolvedValue(undefined),
    reauthenticate: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
  return {
    repo,
    session: (u: SessionUser | null) => act(() => onSession?.(u)),
    profile: (p: Profile | null) => act(() => onProfile?.(p)),
  }
}

function renderAt(path: string, repo: AuthRepository) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ServicesProvider services={fakeServices()}>
        <AppRoutes repo={repo} />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('shows the loader until auth is known', () => {
    const f = fakeRepo()
    renderAt('/', f.repo)
    expect(screen.getByText(copy.loading)).toBeInTheDocument()
  })

  it('sends a signed-out visitor to login', () => {
    const f = fakeRepo()
    renderAt('/', f.repo)
    f.session(null)
    expect(screen.getByLabelText(copy.auth.usernameLabel)).toBeInTheDocument()
  })

  it('sends a user with no profile to choose-phrase', () => {
    const f = fakeRepo()
    renderAt('/', f.repo)
    f.session({ uid: 'u1' })
    f.profile(null)
    expect(screen.getByText(copy.auth.choosePhraseTitle)).toBeInTheDocument()
  })

  it('sends a user with phraseChosen false to choose-phrase', () => {
    const f = fakeRepo()
    renderAt('/login', f.repo)
    f.session({ uid: 'u1' })
    f.profile({ phraseChosen: false })
    expect(screen.getByText(copy.auth.choosePhraseTitle)).toBeInTheDocument()
  })

  it('goes to the island after the phrase is chosen', async () => {
    const f = fakeRepo()
    renderAt('/choose-phrase', f.repo)
    f.session({ uid: 'u1' })
    f.profile({ phraseChosen: false })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(copy.auth.newPhraseLabel), 'my new phrase')
    await user.type(screen.getByLabelText(copy.auth.repeatPhraseLabel), 'my new phrase')
    await user.click(screen.getByRole('button', { name: copy.auth.save }))
    expect(f.repo.changePhrase).toHaveBeenCalledWith('my new phrase')

    f.profile({ phraseChosen: true })
    expect(screen.getByRole('button', { name: copy.places.mochiHouse })).toBeInTheDocument()
  })

  it('keeps a signed-in user with a chosen phrase away from login', () => {
    const f = fakeRepo()
    renderAt('/login', f.repo)
    f.session({ uid: 'u1' })
    f.profile({ phraseChosen: true })
    expect(screen.getByRole('button', { name: copy.places.mochiHouse })).toBeInTheDocument()
    expect(screen.queryByLabelText(copy.auth.usernameLabel)).toBeNull()
  })
})
