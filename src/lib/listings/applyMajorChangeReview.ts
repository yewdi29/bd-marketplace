import type { SupabaseClient } from '@supabase/supabase-js'
import { detectMajorChange, type ListingChangeSnapshot } from './detectMajorChange'
import { scheduleListingVerification } from './scheduleListingVerification'

export async function applyMajorChangeReview(
  adminClient: SupabaseClient,
  listingId: string,
  oldListing: ListingChangeSnapshot,
  newListing: ListingChangeSnapshot,
  statusBeforeEdit: string,
): Promise<boolean> {
  if (!detectMajorChange(oldListing, newListing)) return false

  const now = new Date().toISOString()
  const update: Record<string, string> = {
    last_major_edit_at: now,
    updated_at: now,
  }

  const enteringReview = statusBeforeEdit === 'active'
  // Re-trigger when already pending so a failed/missed first webhook can recover
  // on the next major edit (also starts a new review cycle via last_major_edit_at).
  const alreadyInReview = statusBeforeEdit === 'pending_review'
  const shouldSchedule = enteringReview || alreadyInReview

  if (enteringReview) {
    update.status = 'pending_review'
  }

  await adminClient.from('listings').update(update).eq('id', listingId)

  if (shouldSchedule) {
    scheduleListingVerification(listingId, { previousStatus: statusBeforeEdit })
  }

  return true
}
