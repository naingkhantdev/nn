import { describe, expect, it } from 'vitest'
import { adviceFor, parseIosVersion, supportsWebPush } from './install'

// Real-world user-agent strings.
const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const iphone16_3 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1'
// Safari 26 freezes the OS token at 18_6 and reports the real version in Version/.
const iphoneSafari26 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
const iphoneMessengerFBAN =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/458.0.0.38.108;FBBV/600000000;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]'
const iphoneViber =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Viber/22.4.0'
const iphoneInstagram =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.29.91 (iPhone14,5; iOS 17_5; en_US; en; scale=3.00; 1170x2532; 600000000)'
const iphoneChrome =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1'
const androidChrome =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const androidMessenger =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/458.0.0.43.109;]'

describe('adviceFor', () => {
  it('says installed when running from the Home Screen', () => {
    expect(adviceFor({ userAgent: iphoneSafari, standalone: true })).toBe('installed')
    expect(adviceFor({ userAgent: androidChrome, standalone: true })).toBe('installed')
  })

  it('asks iPhone Safari to add to Home Screen', () => {
    expect(adviceFor({ userAgent: iphoneSafari, standalone: false })).toBe('iosSafariAddToHome')
    expect(adviceFor({ userAgent: iphoneSafari26, standalone: false })).toBe('iosSafariAddToHome')
  })

  it('spots in-app browsers', () => {
    expect(adviceFor({ userAgent: iphoneMessengerFBAN, standalone: false })).toBe('inAppBrowser')
    expect(adviceFor({ userAgent: iphoneViber, standalone: false })).toBe('inAppBrowser')
    expect(adviceFor({ userAgent: iphoneInstagram, standalone: false })).toBe('inAppBrowser')
    expect(adviceFor({ userAgent: androidMessenger, standalone: false })).toBe('inAppBrowser')
  })

  it('lets other browsers go straight to login', () => {
    expect(adviceFor({ userAgent: androidChrome, standalone: false })).toBe('otherBrowser')
    expect(adviceFor({ userAgent: iphoneChrome, standalone: false })).toBe('otherBrowser')
  })
})

describe('parseIosVersion', () => {
  it('reads the OS version', () => {
    expect(parseIosVersion(iphone16_3)).toEqual({ major: 16, minor: 3 })
    expect(parseIosVersion(iphoneMessengerFBAN)).toEqual({ major: 17, minor: 5 })
  })
  it('prefers the newer Safari Version/ when the OS token is frozen', () => {
    expect(parseIosVersion(iphoneSafari26)).toEqual({ major: 26, minor: 0 })
  })
  it('returns null off iOS', () => {
    expect(parseIosVersion(androidChrome)).toBeNull()
  })
})

describe('supportsWebPush', () => {
  it('needs iOS 16.4 or newer', () => {
    expect(supportsWebPush({ major: 16, minor: 3 })).toBe(false)
    expect(supportsWebPush({ major: 16, minor: 4 })).toBe(true)
    expect(supportsWebPush({ major: 17, minor: 0 })).toBe(true)
    expect(supportsWebPush(null)).toBe(false)
  })
})
