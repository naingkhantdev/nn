import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../copy/copy'
import { ServicesProvider } from '../../core/services'
import { PhotoFailed } from './photoCompress'
import type { StarRepository } from './starRepository'
import { SendFailed } from './starRepository'
import { WriteStarScreen } from './WriteStarScreen'
import { fakeStarRepository } from '../../testing/fakeStars'

function fakeStars(send: StarRepository['send'] = vi.fn().mockResolvedValue(undefined)) {
  return fakeStarRepository({ send: vi.fn(send) })
}

function renderWrite(stars: StarRepository, compress = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))) {
  render(
    <MemoryRouter>
      <ServicesProvider services={{ stars }}>
        <WriteStarScreen compress={compress} />
      </ServicesProvider>
    </MemoryRouter>,
  )
  return { compress }
}

const textBox = () => screen.getByLabelText(copy.stars.textLabel)
const sendButton = (name: string = copy.stars.send) => screen.getByRole('button', { name })

describe('WriteStarScreen', () => {
  it('sends a text star and celebrates', async () => {
    const stars = fakeStars()
    renderWrite(stars)
    await userEvent.type(textBox(), 'You are lovely')
    await userEvent.click(sendButton())
    expect(stars.send).toHaveBeenCalledWith({ id: 'draft-1', text: 'You are lovely', photo: null })
    expect(await screen.findByText(copy.stars.sentTitle)).toBeInTheDocument()
  })

  it('refuses more than 1000 characters before sending', async () => {
    const stars = fakeStars()
    renderWrite(stars)
    fireEvent.change(textBox(), { target: { value: 'a'.repeat(1001) } })
    expect(screen.getByText('1001 / 1000')).toBeInTheDocument()
    await userEvent.click(sendButton())
    expect(screen.getByText(copy.stars.tooLong)).toBeInTheDocument()
    expect(stars.send).not.toHaveBeenCalled()
  })

  it('refuses an empty star', async () => {
    const stars = fakeStars()
    renderWrite(stars)
    await userEvent.click(sendButton())
    expect(screen.getByText(copy.stars.empty)).toBeInTheDocument()
    expect(stars.send).not.toHaveBeenCalled()
  })

  it('keeps the text after a failed send, and retries with the same draft', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new SendFailed('failed'))
      .mockResolvedValueOnce(undefined)
    const stars = fakeStars(send)
    renderWrite(stars)
    await userEvent.type(textBox(), 'Hello there')
    await userEvent.click(sendButton())

    expect(await screen.findByText(copy.stars.sendFailed)).toBeInTheDocument()
    expect(textBox()).toHaveValue('Hello there')

    await userEvent.click(sendButton(copy.stars.retry))
    expect(stars.send).toHaveBeenCalledTimes(2)
    expect(vi.mocked(stars.send).mock.calls[1][0].id).toBe('draft-1')
    expect(await screen.findByText(copy.stars.sentTitle)).toBeInTheDocument()
  })

  it('says calmly when offline', async () => {
    const stars = fakeStars(vi.fn().mockRejectedValue(new SendFailed('offline')))
    renderWrite(stars)
    await userEvent.type(textBox(), 'Hello')
    await userEvent.click(sendButton())
    expect(await screen.findByText(copy.stars.offline)).toBeInTheDocument()
    expect(textBox()).toHaveValue('Hello')
  })

  it('keeps the text when a photo cannot be opened', async () => {
    const stars = fakeStars()
    renderWrite(stars, vi.fn().mockRejectedValue(new PhotoFailed('heic')))
    await userEvent.type(textBox(), 'Look at this')
    await userEvent.upload(screen.getByTestId('star-photo-input'), new File(['x'], 'p.heic', { type: 'image/heic' }))
    expect(await screen.findByText(copy.stars.photoFailed)).toBeInTheDocument()
    expect(textBox()).toHaveValue('Look at this')
  })

  it('sends the compressed photo with the star', async () => {
    const stars = fakeStars()
    const { compress } = renderWrite(stars)
    await userEvent.upload(screen.getByTestId('star-photo-input'), new File(['x'], 'p.jpg', { type: 'image/jpeg' }))
    expect(compress).toHaveBeenCalled()
    await screen.findByRole('button', { name: copy.stars.removePhoto })
    await userEvent.click(sendButton())
    expect(stars.send).toHaveBeenCalledWith({ id: 'draft-1', text: '', photo: new Uint8Array([1, 2, 3]) })
  })

  it('takes long Burmese text and emoji', async () => {
    const stars = fakeStars()
    renderWrite(stars)
    const long = 'ကြယ်လေး 🌟 '.repeat(90)
    fireEvent.change(textBox(), { target: { value: long } })
    await userEvent.click(sendButton())
    expect(stars.send).toHaveBeenCalledWith(expect.objectContaining({ text: long.trim() }))
  })
})
