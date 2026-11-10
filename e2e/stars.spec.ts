import { expect, test } from '@playwright/test'

test('a 12 MP photo shrinks to at most 1280 px and under 400 KB in WebKit', async ({ page }) => {
  await page.goto('/?e2e')
  await expect(page.getByTestId('app-root')).toBeVisible({ timeout: 15_000 })

  const result = await page.evaluate(async () => {
    // A noisy 4000x3000 image is the hardest case for JPEG size.
    const canvas = document.createElement('canvas')
    canvas.width = 4000
    canvas.height = 3000
    const ctx = canvas.getContext('2d')!
    const tile = ctx.createImageData(400, 300)
    for (let i = 0; i < tile.data.length; i++) tile.data[i] = (i * 2654435761) % 256
    for (let x = 0; x < 4000; x += 400) for (let y = 0; y < 3000; y += 300) ctx.putImageData(tile, x, y)
    const big = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.95))

    const { compressPhoto } = (window as unknown as { __mochiTest: { compressPhoto: (b: Blob) => Promise<Uint8Array> } })
      .__mochiTest
    const started = performance.now()
    const bytes = await compressPhoto(big)
    const ms = performance.now() - started
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/jpeg' }))
    return { inputBytes: big.size, bytes: bytes.byteLength, width: bitmap.width, height: bitmap.height, ms }
  })

  console.log('photo compression', result)
  expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1280)
  expect(result.bytes).toBeLessThan(900_000)
})

test('undecodable bytes fail kindly', async ({ page }) => {
  await page.goto('/?e2e')
  await expect(page.getByTestId('app-root')).toBeVisible({ timeout: 15_000 })
  const name = await page.evaluate(async () => {
    const { compressPhoto } = (window as unknown as { __mochiTest: { compressPhoto: (b: Blob) => Promise<Uint8Array> } })
      .__mochiTest
    try {
      await compressPhoto(new Blob(['definitely not a photo'], { type: 'image/heic' }))
      return 'no error'
    } catch (err) {
      return (err as Error).name
    }
  })
  expect(name).toBe('PhotoFailed')
})

test('write a long Burmese star and send it', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setViewportSize({ width: 320, height: 568 })

  await page.goto('/stars/write?e2e')
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 })
  const box = page.getByLabel('Your star')
  await box.fill('ကြယ်လေးတစ်ပွင့် ရေးထားတယ်နော် 🌟 '.repeat(30))
  await expect(page.getByText(/ \/ 1000$/)).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'test-results/star-write.png' })

  await page.getByRole('button', { name: 'Fold and send' }).click()
  await expect(page.getByText('Your star is in the jar!')).toBeVisible()
  await page.getByRole('button', { name: 'Back to the Star Jar' }).click()
  await expect(page.getByText("Stars you've written")).toBeVisible()
  // The new star and the earlier ones are listed.
  await expect(page.getByText('You make every day softer 🌸')).toBeVisible()
  await expect(page.locator('.star-list-item')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/star-jar.png' })
  expect(errors).toEqual([])
})

test("open today's star from the jar, then see it in keepsakes", async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/place/starJar?e2e')
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 })
  await expect(page.getByText("Tap the jar to open today's star.")).toBeVisible()
  await page.screenshot({ path: 'test-results/jar-ready.png' })

  await page.getByRole('button', { name: 'Your star jar' }).click()
  const card = page.getByRole('dialog')
  await expect(card.getByText(/I hope today is gentle with you/)).toBeVisible()
  await page.waitForTimeout(800) // let the unfold finish
  await page.screenshot({ path: 'test-results/jar-unfolded.png' })

  await card.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByText("You've opened today's star. Another one tomorrow!")).toBeVisible()

  await page.getByRole('button', { name: 'Keepsakes' }).click()
  await expect(page.getByText(/I hope today is gentle with you/)).toBeVisible()
  await expect(page.getByText('Another one for tomorrow')).toHaveCount(0)
  expect(errors).toEqual([])
})
