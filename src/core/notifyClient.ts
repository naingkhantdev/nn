// Asks the Cloudflare Worker to send a fixed-text notification to the other
// member. Push is a nice extra: every failure is ignored, never shown.

export type NotifyType = 'star_new' | 'treat_sent' | 'sulk_started' | 'sulk_comforted' | 'sulk_forgiven'

export interface NotifyClient {
  send(type: NotifyType): Promise<void>
}

export const silentNotify: NotifyClient = { send: async () => {} }

interface Options {
  /** Worker base URL, e.g. https://mochi-island-notify.<account>.workers.dev */
  url: string | undefined
  getIdToken: () => Promise<string | null>
  fetchFn?: typeof fetch
}

export function createNotifyClient({ url, getIdToken, fetchFn = fetch }: Options): NotifyClient {
  if (!url) return silentNotify
  const endpoint = `${url.replace(/\/+$/, '')}/notify`
  return {
    async send(type) {
      try {
        const token = await getIdToken()
        if (!token) return
        await fetchFn(endpoint, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ type }),
          keepalive: true,
        })
      } catch {
        // Offline, Worker down, or rate-limited: the app works without push.
      }
    },
  }
}
