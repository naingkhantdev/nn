export const MAX_STAR_TEXT = 1000
/** Hard cap per photo document (Firestore's limit is 1 MiB per document). */
export const MAX_PHOTO_BYTES = 900_000

export interface Star {
  id: string
  fromUid: string
  toUid: string
  text: string
  hasPhoto: boolean
  /** null until the server has stamped it. */
  createdAt: Date | null
}

export interface StarDraft {
  /** Stable across retries, so a retried send never makes a duplicate. */
  id: string
  text: string
  photo: Uint8Array | null
}

/**
 * Length as the server counts it (Unicode code points), so an emoji counts
 * once, the same as in firestore.rules.
 */
export function starTextLength(text: string): number {
  return [...text].length
}

export type StarTextProblem = 'empty' | 'tooLong'

export function checkStarText(text: string, hasPhoto: boolean): StarTextProblem | null {
  const length = starTextLength(text.trim())
  if (length === 0 && !hasPhoto) return 'empty'
  if (starTextLength(text) > MAX_STAR_TEXT) return 'tooLong'
  return null
}
