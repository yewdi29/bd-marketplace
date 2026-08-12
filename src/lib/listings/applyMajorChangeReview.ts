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
  if (enteringReview) {
    update.status = 'pending_review'
  }

  await adminClient.from('listings').update(update).eq('id', listingId)

  if (enteringReview) {
    scheduleListingVerification(listingId, { previousStatus: statusBeforeEdit })
  }

  return true
}
