// Shows the Worker's fixed-text notifications and opens the island on tap.
// Plain push handler, no Firebase SDK: the Worker sends FCM "notification"
// payloads, which arrive here as { notification: { title, body }, fcmOptions }.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }
  const notification = payload.notification || {}
  const link = (payload.fcmOptions && payload.fcmOptions.link) || '/'
  event.waitUntil(
    self.registration.showNotification(notification.title || 'Mochi Island', {
      body: notification.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ('focus' in w) return w.focus()
      }
      return self.clients.openWindow(link)
    }),
  )
})
