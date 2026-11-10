import { handleNotify } from './notify'
import { createRateLimiter } from './rateLimit'
import {
  fetchDeviceToken,
  fetchMemberUids,
  getAccessToken,
  sendFcmMessage,
  verifyFirebaseIdToken,
  type KvLike,
  type ServiceAccount,
} from './google'

export interface Env {
  /** Secret: the Firebase service account JSON. Set with `wrangler secret put`. */
  FCM_SERVICE_ACCOUNT: string
  FIREBASE_PROJECT_ID: string
  /** Comma-separated list of allowed browser origins. */
  ALLOWED_ORIGINS: string
  /** Optional KV namespace for caching the Google access token. */
  TOKENS?: KvLike
}

const rateLimit = createRateLimiter(30, 3_600_000)

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('origin')
    const cors = corsHeaders(origin, env)
    const url = new URL(req.url)

    if (url.pathname !== '/notify') return new Response(null, { status: 404 })
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors })

    const sa = JSON.parse(env.FCM_SERVICE_ACCOUNT) as ServiceAccount
    const projectId = env.FIREBASE_PROJECT_ID
    const token = () => getAccessToken(sa, env.TOKENS)

    let res: Response
    try {
      res = await handleNotify(req, {
        verifyIdToken: (t) => verifyFirebaseIdToken(t, projectId),
        getMemberUids: async () => fetchMemberUids(projectId, await token()),
        getDeviceToken: async (uid) => fetchDeviceToken(projectId, await token(), uid),
        sendFcm: async (t, text) => sendFcmMessage(projectId, await token(), t, text),
        rateLimit,
      })
    } catch {
      res = new Response(null, { status: 502 })
    }
    return new Response(res.body, { status: res.status, headers: { ...cors } })
  },
}
