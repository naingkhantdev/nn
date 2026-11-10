import { copy, notifyTypes, type NotificationText, type NotifyType } from './copy'

export type FcmResult = 'ok' | 'unregistered' | 'error'

export interface Deps {
  /** Returns the uid for a valid Firebase ID token, or null. */
  verifyIdToken(token: string): Promise<string | null>
  getMemberUids(): Promise<string[]>
  getDeviceToken(uid: string): Promise<string | null>
  sendFcm(token: string, text: NotificationText): Promise<FcmResult>
  /** Returns true when the call is allowed. */
  rateLimit(uid: string): boolean
}

const empty = (status: number) => new Response(null, { status })

function isNotifyType(v: unknown): v is NotifyType {
  return typeof v === 'string' && (notifyTypes as string[]).includes(v)
}

export async function handleNotify(req: Request, deps: Deps): Promise<Response> {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return empty(401)

  const uid = await deps.verifyIdToken(token)
  if (!uid) return empty(401)

  const members = await deps.getMemberUids()
  if (!members.includes(uid)) return empty(403)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return empty(400)
  }
  const type = (body as { type?: unknown } | null)?.type
  if (!isNotifyType(type)) return empty(400)

  if (!deps.rateLimit(uid)) return empty(429)

  const other = members.find((m) => m !== uid)
  if (!other) return empty(204)

  const deviceToken = await deps.getDeviceToken(other)
  if (!deviceToken) return empty(204)

  // Text always comes from copy.ts; anything else in the body is ignored.
  const result = await deps.sendFcm(deviceToken, copy[type])
  return empty(result === 'error' ? 502 : 204)
}
