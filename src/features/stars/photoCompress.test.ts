import { describe, expect, it, vi } from 'vitest'
import { PhotoFailed, TARGET_PHOTO_BYTES, compressPhoto, encodeWithinBudget, fitWithin } from './photoCompress'

const blobOf = (size: number) => new Blob([new Uint8Array(size)])

describe('fitWithin', () => {
  it('shrinks a 12 MP photo so the longest side is 1280', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 })
  })
  it('never enlarges a small photo', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('encodeWithinBudget', () => {
  it('stops at the first quality under the target', async () => {
    const encode = vi.fn(async (q: number) => blobOf(q >= 0.8 ? 600_000 : 350_000))
    const bytes = await encodeWithinBudget(encode)
    expect(bytes.byteLength).toBe(350_000)
    expect(encode).toHaveBeenCalledTimes(2)
  })

  it('keeps the smallest result when nothing reaches the target but it fits the cap', async () => {
    const bytes = await encodeWithinBudget(async (q) => blobOf(Math.round(q * 1_000_000)))
    expect(bytes.byteLength).toBe(500_000)
    expect(bytes.byteLength).toBeGreaterThan(TARGET_PHOTO_BYTES)
  })

  it('throws PhotoFailed when even the lowest quality is over the cap', async () => {
    await expect(encodeWithinBudget(async () => blobOf(950_000))).rejects.toBeInstanceOf(PhotoFailed)
  })

  it('reports progress', async () => {
    const progress: number[] = []
    await encodeWithinBudget(async () => blobOf(100), (p) => progress.push(p))
    expect(progress.length).toBeGreaterThan(0)
  })
})

describe('compressPhoto', () => {
  it('throws PhotoFailed for bytes that are not an image', async () => {
    // jsdom cannot decode images, just like a browser facing HEIC it does not support.
    await expect(compressPhoto(new Blob(['not an image']))).rejects.toBeInstanceOf(PhotoFailed)
  })
})
