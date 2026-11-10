// Fixed notification text, written as Mochi speaking.
// The Worker cannot import the app's copy.ts, so these lines live here.
// The owner reviews all Burmese before she sees any of it.
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
  star_new: { title, body: 'ကြယ်လေးတစ်ပွင့် ပုလင်းထဲ ရောက်လာပြီနော် ✨' },
  treat_sent: { title, body: 'မိုချီက လက်ဆောင်လေး ယူလာပေးတယ် 🍡' },
  sulk_started: { title, body: 'ကျွန်းပေါ်မှာ တိမ်မည်းလေးတွေ ရောက်လာပြီ ☁️' },
  sulk_comforted: { title, body: 'နေရောင်လေး နည်းနည်း ပြန်ထွက်လာပြီ 🌤️' },
  sulk_forgiven: { title, body: 'သက်တံ့လေး ထွက်လာပြီ! မိုချီ ကနေပြီ 🌈' },
}

export const notifyTypes = Object.keys(copy) as NotifyType[]
