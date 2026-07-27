import { MAX_LISTING_PHOTOS } from '@/lib/listings/listingPhotoUpload'
import { MAX_LISTING_VIDEOS } from '@/lib/listings/listingVideoUpload'

export const LISTING_MEDIA_DROP_PHOTO_RULE =
  `Photos: PNG or JPEG, max 4 MB per photo, up to ${MAX_LISTING_PHOTOS}`

export const LISTING_MEDIA_DROP_VIDEO_RULE =
  `Video: MP4, max 3 minutes, up to ${MAX_LISTING_VIDEOS} videos`
