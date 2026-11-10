import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { AuthFailure } from './authRepository'
import { LoginScreen } from './LoginScreen'

async function fillAndSubmit(name: string, phrase: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(copy.auth.usernameLabel), name)
  await user.type(screen.getByLabelText(copy.auth.phraseLabel), phrase)
  await user.click(screen.getByRole('button', { name: copy.auth.signIn }))
}

describe('LoginScreen', () => {
  it('signs in with the typed name and phrase', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined)
    render(<LoginScreen signIn={signIn} />)
    await fillAndSubmit('noe', 'secret phrase')
    expect(signIn).toHaveBeenCalledWith('noe', 'secret phrase')
  })

  it('shows a friendly message on a wrong phrase and keeps the form', async () => {
    const signIn = vi.fn().mockRejectedValue(new AuthFailure('wrongPhrase'))
    render(<LoginScreen signIn={signIn} />)
    await fillAndSubmit('noe', 'nope')
    expect(await screen.findByText(copy.auth.wrongPhrase)).toBeInTheDocument()
    expect(screen.getByLabelText(copy.auth.usernameLabel)).toHaveValue('noe')
    expect(screen.getByRole('button', { name: copy.auth.signIn })).toBeEnabled()
  })

  it('shows the offline message when there is no network', async () => {
    const signIn = vi.fn().mockRejectedValue(new AuthFailure('offline'))
    render(<LoginScreen signIn={signIn} />)
    await fillAndSubmit('noe', 'secret phrase')
    expect(await screen.findByText(copy.auth.offline)).toBeInTheDocument()
  })

  it('has no sign-up option', () => {
    render(<LoginScreen signIn={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
