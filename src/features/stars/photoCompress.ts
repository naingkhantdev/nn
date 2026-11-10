import { MAX_PHOTO_BYTES } from './star'

export const MAX_PHOTO_SIDE = 1280
/** Aim for about 300 KB; stop stepping quality once under this. */
export const TARGET_PHOTO_BYTES = 400_000
const QUALITIES = [0.8, 0.7, 0.6, 0.5] as const

export class PhotoFailed extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'PhotoFailed'
  }
}

/** Scale (w, h) so the longest side is at most `max`, never enlarging. */
export function fitWithin(width: number, height: number, max = MAX_PHOTO_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * Encode at stepping JPEG qualities until under the target. Yields between
 * steps so the screen stays responsive. Throws PhotoFailed if even the
 * lowest quality is over the hard cap.
 */
export async function encodeWithinBudget(
  encode: (quality: number) => Promise<Blob>,
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  let smallest: Blob | null = null
  for (let i = 0; i < QUALITIES.length; i++) {
    await nextFrame()
    const blob = await encode(QUALITIES[i])
    onProgress?.(0.4 + (0.6 * (i + 1)) / QUALITIES.length)
    if (!smallest || blob.size < smallest.size) smallest = blob
    if (blob.size <= TARGET_PHOTO_BYTES) break
  }
  if (!smallest || smallest.size > MAX_PHOTO_BYTES) throw new PhotoFailed('too big after compression')
  return new Uint8Array(await smallest.arrayBuffer())
}

interface Decoded {
  width: number
  height: number
  source: CanvasImageSource
  close(): void
}

async function decode(file: Blob): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() }
  } catch {
    // Older Safari: fall back to an <img>, which also handles some HEIC.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return { width: img.naturalWidth, height: img.naturalHeight, source: img, close: () => {} }
    } catch {
      throw new PhotoFailed('cannot decode')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

/** Shrink a picked photo to a JPEG of at most 1280px and ~300 KB. */
export async function compressPhoto(file: Blob, onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  onProgress?.(0)
  let decoded: Decoded
  try {
    decoded = await decode(file)
  } catch (err) {
    throw err instanceof PhotoFailed ? err : new PhotoFailed('cannot decode')
  }
  try {
    if (!decoded.width || !decoded.height) throw new PhotoFailed('empty image')
    onProgress?.(0.2)
    const { width, height } = fitWithin(decoded.width, decoded.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new PhotoFailed('no canvas')
    ctx.fillStyle = '#ffffff' // transparent PNGs become white, not black
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(decoded.source, 0, 0, width, height)
    onProgress?.(0.4)

    const encode = (quality: number) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new PhotoFailed('encode failed'))), 'image/jpeg', quality),
      )
    const bytes = await encodeWithinBudget(encode, onProgress)
    // Free the big canvas memory straight away (matters on iPhone).
    canvas.width = 0
    canvas.height = 0
    return bytes
  } catch (err) {
    throw err instanceof PhotoFailed ? err : new PhotoFailed(String(err))
  } finally {
    decoded.close()
  }
}
