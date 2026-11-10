import { expect, test } from '@playwright/test'

// Risk check: the app starts in iPhone Safari's engine and Burmese renders.
const burmeseSample =
  'မင်္ဂလာပါ။ ဒီနေ့ ကြယ်လေးတစ်ပွင့် ရေးထားတယ်နော် 🌟 ချစ်တယ် 💕 ' +
  'ကျွန်ုပ်တို့ ကျွန်းလေးမှာ ပျော်ပျော်နေကြမယ်။'

test('app root appears with no page errors and Burmese renders', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')
  await expect(page.getByTestId('app-root')).toBeVisible({ timeout: 15_000 })
  // The HTML loader must fade out and be removed, not linger over the app.
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 })

  // Add a long Burmese + emoji line so the screenshot shows real shaping.
  await page.evaluate((text) => {
    const p = document.createElement('p')
    p.textContent = text
    p.style.padding = '0 16px'
    document.querySelector('[data-testid="app-root"] > div')?.appendChild(p)
  }, burmeseSample)

  await page.screenshot({ path: 'test-results/smoke-iphone.png', fullPage: true })
  expect(errors).toEqual([])
})
