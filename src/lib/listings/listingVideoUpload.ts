export const MAX_LISTING_VIDEOS = 3

export const MAX_VIDEO_DURATION_SECONDS = 180

export const VIDEO_TOO_LONG_REJECTION_REASON =
  'This video is longer than the 3-minute limit and was not saved.'

export const ACTIVE_LISTING_VIDEO_STATUSES = [
  'uploading',
  'processing',
  'ready',
] as const

/** Lowest unused slot (1–3), or null when all positions are taken. */
export function nextAvailableVideoPosition(usedPositions: number[]): number | null {
  for (let position = 1; position <= MAX_LISTING_VIDEOS; position++) {
    if (!usedPositions.includes(position)) return position
  }
  return null
}
