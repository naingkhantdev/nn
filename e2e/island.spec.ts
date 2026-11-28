import { copy } from '../src/copy/copy'
import { expect, test } from '@playwright/test'

for (const home of ['/', '/visit']) {
  test(`boat lands on the shared island from ${home}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${home}?e2e`)
    await page.getByRole('link', { name: copy.sharedIsland }).click()
    await expect(page).toHaveURL(url => url.pathname === '/between-islands')
    const mochi = page.locator('.shared-arriving')
    const boat = page.locator('.shared-arrival-boat')
    await expect(boat).toBeVisible()
    await expect(mochi).toHaveCSS('animation-name', 'shared-disembark')
    await page.locator('.shared-by-sea').evaluate(el => {
      for (const animation of el.getAnimations({ subtree: true })) {
        if (animation instanceof CSSAnimation && ['shared-disembark', 'shared-boat-dock'].includes(animation.animationName)) {
          animation.pause()
          animation.currentTime = 1700
        }
      }
    })
    await page.screenshot({ path: `test-results/shared-landing-${home === '/' ? 'own' : 'friend'}.png` })
    await page.locator('.shared-by-sea').evaluate(el => {
      for (const animation of el.getAnimations({ subtree: true })) {
        if (animation.effect?.getTiming().iterations === 1) animation.finish()
      }
    })
    await expect(mochi).toBeVisible()
    await page.screenshot({ path: `test-results/shared-landed-${home === '/' ? 'own' : 'friend'}.png` })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(mochi).toHaveCSS('animation-name', 'none')
    await expect(boat).toHaveCSS('animation-name', 'none')
    await expect(page.getByRole('button', { name: copy.places.starJar })).toBeVisible()
  })
}

// The island at the smallest and largest phone sizes, signed in through the
// e2e-only fake session (?e2e, only honoured in builds made with --mode e2e).
for (const size of [
  { width: 320, height: 568 },
  { width: 430, height: 932 },
]) {
  test(`island fits ${size.width}x${size.height} without overflow`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.setViewportSize(size)

    await page.goto('/?e2e')
    await expect(page.getByRole('link', { name: copy.sharedIsland })).toBeVisible()
    await expect(page.locator('#loader')).toHaveCount(0)
    await page.screenshot({ path: `test-results/home-${size.width}x${size.height}.png` })
    await page.getByRole('link', { name: copy.sharedIsland }).click()
    await expect(page.getByRole('button', { name: "Mochi's house" })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 })

    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - window.innerWidth,
      y: document.documentElement.scrollHeight - window.innerHeight,
    }))
    expect(overflow.x).toBeLessThanOrEqual(0)
    expect(overflow.y).toBeLessThanOrEqual(0)

    // Every place button sits fully inside the screen.
    for (const box of await page.locator('.island-place').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON()),
    )) {
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(size.width)
      expect(box.bottom).toBeLessThanOrEqual(size.height)
    }

    await page.screenshot({ path: `test-results/island-${size.width}x${size.height}.png` })
    for (const place of ['starJar', 'snailPost'] as const) {
      await page.getByRole('button', { name: copy.places[place] }).click()
      await expect(page).toHaveURL(url => url.pathname === '/place/' + place)
      await page.goBack()
    }
    await page.getByRole('button', { name: copy.islandName(copy.island.khant) }).click()
    await expect(page.getByRole('link', { name: copy.sharedIsland })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("Mochi's house: petting makes Mochi happy", async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/place/mochiHouse?e2e')
  await page.getByRole('button', { name: 'Pet Mochi' }).click()
  await expect(page.getByText('Mochi wiggles happily!')).toBeVisible()
  await page.waitForTimeout(300) // mid-animation: hearts floating
  await page.screenshot({ path: 'test-results/mochi-house.png' })
  expect(errors).toEqual([])
})

test('how I feel now: pick a feeling and send a treat', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/place/feelings?e2e')
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 })
  await page.getByRole('button', { name: /Hungry/ }).click()
  await expect(page.getByRole('button', { name: /Hungry/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Send a blanket 🧣' }).click()
  await expect(page.getByText('Sent! Mochi is carrying it over.')).toBeVisible()
  await page.screenshot({ path: 'test-results/feelings.png', fullPage: true })

  // Back on the island: the other person's sleepy bubble shows.
  await page.getByRole('button', { name: 'Back to the island' }).click()
  await expect(page.getByRole('img', { name: 'Across the island, feeling sleepy' })).toBeVisible()
  await page.screenshot({ path: 'test-results/island-feelings.png' })
  expect(errors).toEqual([])
})
