import { waitUntil } from '@vercel/functions'
import { runInquiryVerificationPipeline } from '@/lib/inquiryVerification/runPipeline'

function paperclipWebhookUrl(): string | undefined {
  return (
    process.env.PAPERCLIP_INQUIRY_TRIGGER_URL ??
    process.env.PAPERCLIP_WEBHOOK_URL ??
    undefined
  )
}

/** Returns true when a Paperclip webhook POST was initiated. */
function triggerPaperclipAgent(leadId: string): boolean {
  const url = paperclipWebhookUrl()
  const secret = process.env.PAPERCLIP_AGENT_SECRET

  if (!url || !secret) {
    return false
  }

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret,
    },
    body: JSON.stringify({
      type: 'INSERT',
      table: 'leads',
      record: { id: leadId, tier: 'green', trigger: 'inquiry_verification' },
    }),
  })
    .then(async res => {
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(
          `[inquiry] Paperclip webhook returned ${res.status} for lead ${leadId}:`,
          body,
        )
      }
    })
    .catch(err => {
      console.error('[inquiry] Paperclip webhook request failed:', err)
    })

  return true
}

async function runInternalPipeline(leadId: string): Promise<void> {
  try {
    await runInquiryVerificationPipeline(leadId)
  } catch (err) {
    console.error(`[inquiry] internal verification pipeline failed for ${leadId}:`, err)
  }
}

/**
 * Fire-and-forget inquiry verification.
 * Prefers Paperclip when configured; otherwise runs the Next.js pipeline directly
 * (local dev and when Paperclip env vars are missing).
 */
export function scheduleInquiryVerification(leadId: string): void {
  const paperclipTriggered = triggerPaperclipAgent(leadId)

  if (paperclipTriggered) {
    console.log(`[inquiry] Paperclip verification triggered for lead ${leadId}`)
    return
  }

  console.warn(
    `[inquiry] Paperclip not configured (set PAPERCLIP_INQUIRY_TRIGGER_URL or PAPERCLIP_WEBHOOK_URL + PAPERCLIP_AGENT_SECRET) — running internal pipeline for lead ${leadId}`,
  )

  try {
    waitUntil(runInternalPipeline(leadId))
  } catch {
    void runInternalPipeline(leadId)
  }
}
