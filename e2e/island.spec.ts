import { expect, test } from '@playwright/test'

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
    expect(errors).toEqual([])
  })
}
