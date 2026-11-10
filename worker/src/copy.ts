// Fixed notification text, written as Mochi speaking.
// The Worker cannot import the app's copy.ts, so these lines live here.
// No notification may guilt, pressure, or reveal activity.

export type NotifyType =
  | 'star_new'
  | 'treat_sent'
  | 'sulk_started'
  | 'sulk_comforted'
  | 'sulk_forgiven'

export interface NotificationText {
  title: string
  body: string
}

const title = 'Mochi Island'

export const copy: Record<NotifyType, NotificationText> = {
  star_new: { title, body: 'A little star just landed in the jar ✨' },
  treat_sent: { title, body: 'Mochi brought you a little treat 🍡' },
  sulk_started: { title, body: 'A few grey clouds drifted over the island ☁️' },
  sulk_comforted: { title, body: 'The sun is peeking out again 🌤️' },
  sulk_forgiven: { title, body: 'A rainbow! Mochi is dancing 🌈' },
}

export const notifyTypes = Object.keys(copy) as NotifyType[]
