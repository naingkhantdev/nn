import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { AuthFailure } from './authRepository'
import { ChoosePhraseScreen } from './ChoosePhraseScreen'

async function choose(phrase: string, repeat = phrase) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(copy.auth.newPhraseLabel), phrase)
  await user.type(screen.getByLabelText(copy.auth.repeatPhraseLabel), repeat)
  await user.click(screen.getByRole('button', { name: copy.auth.save }))
}

describe('ChoosePhraseScreen', () => {
  it('explains kindly that the phrase becomes hers alone', () => {
    render(<ChoosePhraseScreen changePhrase={vi.fn()} signOut={vi.fn()} />)
    expect(screen.getByText(copy.auth.choosePhraseIntro)).toBeInTheDocument()
  })

  it('refuses a phrase shorter than 6 characters without calling the server', async () => {
    const changePhrase = vi.fn()
    render(<ChoosePhraseScreen changePhrase={changePhrase} signOut={vi.fn()} />)
    await choose('12345')
    expect(await screen.findByText(copy.auth.tooShort)).toBeInTheDocument()
    expect(changePhrase).not.toHaveBeenCalled()
  })

  it('refuses two different phrases', async () => {
    const changePhrase = vi.fn()
    render(<ChoosePhraseScreen changePhrase={changePhrase} signOut={vi.fn()} />)
    await choose('123456', '654321')
    expect(await screen.findByText(copy.auth.mismatch)).toBeInTheDocument()
    expect(changePhrase).not.toHaveBeenCalled()
  })

  it('saves a good phrase', async () => {
    const changePhrase = vi.fn().mockResolvedValue(undefined)
    render(<ChoosePhraseScreen changePhrase={changePhrase} signOut={vi.fn()} />)
    await choose('my new phrase')
    expect(changePhrase).toHaveBeenCalledWith('my new phrase')
  })

  it('shows a calm message when saving fails', async () => {
    const changePhrase = vi.fn().mockRejectedValue(new AuthFailure('offline'))
    render(<ChoosePhraseScreen changePhrase={changePhrase} signOut={vi.fn()} />)
    await choose('my new phrase')
    expect(await screen.findByText(copy.auth.offline)).toBeInTheDocument()
  })
})
