import type { SupabaseClient } from '@supabase/supabase-js'

const NON_GALLERY_VIDEO_STATUSES = ['rejected_too_long', 'error'] as const

/** Next slot in the combined photo+video gallery (0-based). */
export async function nextGalleryPosition(
  client: SupabaseClient,
  listingId: string,
): Promise<number> {
  const [{ data: images }, { data: videos }] = await Promise.all([
    client
      .from('listing_images')
      .select('gallery_position')
      .eq('listing_id', listingId),
    client
      .from('listing_videos')
      .select('gallery_position, status')
      .eq('listing_id', listingId),
  ])

  const positions = [
    ...(images ?? []).map((row) => row.gallery_position),
    ...(videos ?? [])
      .filter((row) => isGalleryVideoStatus(row.status))
      .map((row) => row.gallery_position),
  ].filter((value): value is number => value != null)

  if (positions.length === 0) return 0
  return Math.max(...positions) + 1
}

export function isGalleryVideoStatus(status: string): boolean {
  return !NON_GALLERY_VIDEO_STATUSES.includes(
    status as (typeof NON_GALLERY_VIDEO_STATUSES)[number],
  )
}
