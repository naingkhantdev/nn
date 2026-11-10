import { describe, expect, it, vi } from 'vitest'
import { createNotifyClient } from './notifyClient'

describe('createNotifyClient', () => {
  it('posts only the type, with the ID token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const client = createNotifyClient({ url: 'https://w.example/', getIdToken: async () => 'tok', fetchFn })
    await client.send('star_new')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://w.example/notify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'star_new' }),
        headers: expect.objectContaining({ authorization: 'Bearer tok' }),
      }),
    )
  })

  it('ignores network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('offline'))
    const client = createNotifyClient({ url: 'https://w.example', getIdToken: async () => 'tok', fetchFn })
    await expect(client.send('star_new')).resolves.toBeUndefined()
  })

  it('does nothing without a Worker URL or a signed-in user', async () => {
    const fetchFn = vi.fn()
    await createNotifyClient({ url: undefined, getIdToken: async () => 'tok', fetchFn }).send('star_new')
    await createNotifyClient({ url: 'https://w.example', getIdToken: async () => null, fetchFn }).send('star_new')
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
