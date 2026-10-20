/**
 * Fire-and-forget Listing Verifier trigger — mirrors inquiry verification's
 * Paperclip webhook pattern (scheduleInquiryVerification).
 *
 * Primary path for listing verification. Does not block publish/resubmit.
 */

import { createClient } from '@supabase/supabase-js'
import { resolveCountryLocationRequirements } from '@/lib/listings/locationRequirements'

const DEFAULT_PAPERCLIP_LISTING_WEBHOOK_PATH =
  '/api/plugins/bd-webhook-receiver/webhooks/supabase'

function paperclipListingWebhookUrl(): string | undefined {
  const raw =
    process.env.PAPERCLIP_LISTING_TRIGGER_URL
    ?? process.env.PAPERCLIP_WEBHOOK_URL
    ?? undefined

  if (!raw) return undefined

  try {
    const parsed = new URL(raw)
    // Local/prod env sometimes stores only the Railway host (POST / → 404).
    // Normalize to the bd-webhook-receiver supabase endpoint.
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = DEFAULT_PAPERCLIP_LISTING_WEBHOOK_PATH
    }
    return parsed.toString()
  } catch {
    return raw
  }
}

export interface ListingVerificationWebhookContext {
  country_slug: string | null
  country_has_subdivisions: boolean
}

/** Returns true when a Paperclip webhook POST was initiated. */
async function triggerPaperclipListingAgent(
  listingId: string,
  opts?: { previousStatus?: string | null; locationContext?: ListingVerificationWebhookContext },
): Promise<boolean> {
  const url = paperclipListingWebhookUrl()
  const secret = process.env.PAPERCLIP_AGENT_SECRET

  if (!url || !secret) {
    return false
  }

  const previousStatus = opts?.previousStatus ?? 'draft'
  const locationContext = opts?.locationContext ?? {
    country_slug: null,
    country_has_subdivisions: false,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret,
    },
    body: JSON.stringify({
      type: 'UPDATE',
      table: 'listings',
      record: {
        id: listingId,
        status: 'pending_review',
        country_slug: locationContext.country_slug,
        country_has_subdivisions: locationContext.country_has_subdivisions,
      },
      old_record: { status: previousStatus },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(
      `[listing] Paperclip webhook returned ${res.status} for listing ${listingId}:`,
      body,
    )
  }

  return true
}

async function fetchListingLocationContext(
  listingId: string,
): Promise<ListingVerificationWebhookContext> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return { country_slug: null, country_has_subdivisions: false }
  }

  const adminClient = createClient(url, key)
  const { data: listing } = await adminClient
    .from('listings')
    .select('country_id')
    .eq('id', listingId)
    .maybeSingle()

  if (!listing?.country_id) {
    return { country_slug: null, country_has_subdivisions: false }
  }

  const { countrySlug, countryHasSubdivisions } = await resolveCountryLocationRequirements(
    adminClient,
    listing.country_id,
  )

  return {
    country_slug: countrySlug,
    country_has_subdivisions: countryHasSubdivisions,
  }
}

/**
 * Schedule listing verification after a transition into pending_review.
 * Fire-and-forget — never awaits Paperclip / Claude in the caller's critical path.
 */
export function scheduleListingVerification(
  listingId: string,
  opts?: { previousStatus?: string | null },
): void {
  void (async () => {
    const url = paperclipListingWebhookUrl()
    const secret = process.env.PAPERCLIP_AGENT_SECRET

    if (!url || !secret) {
      console.warn(
        `[listing] Paperclip not configured (set PAPERCLIP_LISTING_TRIGGER_URL or PAPERCLIP_WEBHOOK_URL + PAPERCLIP_AGENT_SECRET) — listing ${listingId} will remain in pending_review until triggered`,
      )
      return
    }

    const locationContext = await fetchListingLocationContext(listingId)
    const triggered = await triggerPaperclipListingAgent(listingId, {
      ...opts,
      locationContext,
    })

    if (triggered) {
      console.log(`[listing] Paperclip verification triggered for listing ${listingId}`)
    }
  })().catch(err => {
    console.error(`[listing] Paperclip verification scheduling failed for ${listingId}:`, err)
  })
}
