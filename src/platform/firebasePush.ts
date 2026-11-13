// Real browser + Firebase pieces for PushService. Thin glue; logic is in push.ts.
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import { deleteDoc, doc, setDoc, type Firestore } from 'firebase/firestore'
import { createPushService, type PushService } from './push'

// The FCM worker gets its own scope so it never fights the PWA's sw.js.
const SW_URL = '/firebase-messaging-sw.js'
const SW_SCOPE = '/firebase-cloud-messaging-push-scope'

interface Options {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  /** Public Web Push key from the Firebase console. Missing = push off. */
  vapidKey: string | undefined
}

function browserSupportsPush(): boolean {
  try {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  } catch {
    return false
  }
}

export function createFirebasePush({
  app,
  auth,
  db,
  vapidKey,
}: Options): PushService {
  // Loaded lazily so browsers without push never download messaging code.
  const messaging = async () => {
    const m = await import('firebase/messaging')
    return { m, instance: m.getMessaging(app) }
  }
  const deviceDoc = () => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('signed out')
    return doc(db, 'devices', uid)
  }

  return createPushService({
    supported: Boolean(vapidKey) && browserSupportsPush(),
    permission: () => Notification.permission,
    requestPermission: () => Notification.requestPermission(),
    async getToken() {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
      })
      const { m, instance } = await messaging()
      return m.getToken(instance, {
        vapidKey,
        serviceWorkerRegistration: registration,
      })
    },
    async deleteToken() {
      const { m, instance } = await messaging()
      await m.deleteToken(instance)
    },
    saveToken: (token) => setDoc(deviceDoc(), { token }),
    removeToken: () => deleteDoc(deviceDoc()),
  })
}
