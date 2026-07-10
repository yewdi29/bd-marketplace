import type { SupabaseClient } from '@supabase/supabase-js'
import { detectMajorChange, type ListingChangeSnapshot } from './detectMajorChange'

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

  if (statusBeforeEdit === 'active') {
    update.status = 'pending_review'
  }

  await adminClient.from('listings').update(update).eq('id', listingId)
  return true
}
