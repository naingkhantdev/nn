import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose'
import type { FcmResult } from './notify'
import type { NotificationText } from './copy'

export interface ServiceAccount {
  client_email: string
  private_key: string
  project_id: string
}

export interface KvLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

/** Verifies a Firebase Auth ID token and returns its uid, or null. */
export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    })
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

// Google access token, cached in the isolate and in KV until 5 minutes before expiry,
// so RS256 signing (the CPU-heavy part) happens about once an hour.
let memToken: { value: string; expiresAt: number } | null = null
const KV_KEY = 'google-access-token'
const SCOPES = [
  'https://www.googleapis.com/auth/firebase.messaging',
  'https://www.googleapis.com/auth/datastore',
].join(' ')

export async function getAccessToken(sa: ServiceAccount, kv?: KvLike, now = Date.now()): Promise<string> {
  if (memToken && memToken.expiresAt - 300_000 > now) return memToken.value

  if (kv) {
    const cached = await kv.get(KV_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as { value: string; expiresAt: number }
      if (parsed.expiresAt - 300_000 > now) {
        memToken = parsed
        return parsed.value
      }
    }
  }

  const key = await importPKCS8(sa.private_key, 'RS256')
  const iat = Math.floor(now / 1000)
  const assertion = await new SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(iat)
    .setExpirationTime(iat + 3600)
    .sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  memToken = { value: json.access_token, expiresAt: now + json.expires_in * 1000 }
  if (kv) {
    await kv.put(KV_KEY, JSON.stringify(memToken), { expirationTtl: Math.max(60, json.expires_in - 300) })
  }
  return memToken.value
}

const docsUrl = (projectId: string) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

let memMembers: { uids: string[]; at: number } | null = null

export async function fetchMemberUids(projectId: string, accessToken: string, now = Date.now()): Promise<string[]> {
  if (memMembers && now - memMembers.at < 300_000) return memMembers.uids
  const res = await fetch(`${docsUrl(projectId)}/config/members`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`members read failed: ${res.status}`)
  const doc = (await res.json()) as {
    fields?: { uids?: { arrayValue?: { values?: { stringValue?: string }[] } } }
  }
  const uids = (doc.fields?.uids?.arrayValue?.values ?? [])
    .map((v) => v.stringValue)
    .filter((v): v is string => typeof v === 'string')
  memMembers = { uids, at: now }
  return uids
}

export async function fetchDeviceToken(projectId: string, accessToken: string, uid: string): Promise<string | null> {
  const res = await fetch(`${docsUrl(projectId)}/devices/${encodeURIComponent(uid)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`device read failed: ${res.status}`)
  const doc = (await res.json()) as { fields?: { token?: { stringValue?: string } } }
  return doc.fields?.token?.stringValue ?? null
}

export async function sendFcmMessage(
  projectId: string,
  accessToken: string,
  token: string,
  text: NotificationText,
): Promise<FcmResult> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: text.title, body: text.body },
        webpush: { fcm_options: { link: '/' } },
      },
    }),
  })
  if (res.ok) return 'ok'
  const err = await res.text()
  if (res.status === 404 || err.includes('UNREGISTERED')) return 'unregistered'
  return 'error'
}
