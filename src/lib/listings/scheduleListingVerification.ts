/**
 * Fire-and-forget Listing Verifier trigger — mirrors inquiry verification's
 * Paperclip webhook pattern (scheduleInquiryVerification).
 *
 * Primary path for listing verification. Does not block publish/resubmit.
 */

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

/** Returns true when a Paperclip webhook POST was initiated. */
function triggerPaperclipListingAgent(
  listingId: string,
  opts?: { previousStatus?: string | null },
): boolean {
  const url = paperclipListingWebhookUrl()
  const secret = process.env.PAPERCLIP_AGENT_SECRET

  if (!url || !secret) {
    return false
  }

  const previousStatus = opts?.previousStatus ?? 'draft'

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret,
    },
    body: JSON.stringify({
      type: 'UPDATE',
      table: 'listings',
      record: { id: listingId, status: 'pending_review' },
      old_record: { status: previousStatus },
    }),
  })
    .then(async res => {
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(
          `[listing] Paperclip webhook returned ${res.status} for listing ${listingId}:`,
          body,
        )
      }
    })
    .catch(err => {
      console.error(`[listing] Paperclip webhook request failed for ${listingId}:`, err)
    })

  return true
}

/**
 * Schedule listing verification after a transition into pending_review.
 * Fire-and-forget — never awaits Paperclip / Claude.
 */
export function scheduleListingVerification(
  listingId: string,
  opts?: { previousStatus?: string | null },
): void {
  const triggered = triggerPaperclipListingAgent(listingId, opts)

  if (triggered) {
    console.log(`[listing] Paperclip verification triggered for listing ${listingId}`)
    return
  }

  console.warn(
    `[listing] Paperclip not configured (set PAPERCLIP_LISTING_TRIGGER_URL or PAPERCLIP_WEBHOOK_URL + PAPERCLIP_AGENT_SECRET) — listing ${listingId} will remain in pending_review until triggered`,
  )
}
