/** Fire-and-forget trigger for Paperclip Inquiry Verification Agent. */
export function triggerInquiryVerificationAgent(leadId: string): void {
  const url = process.env.PAPERCLIP_INQUIRY_TRIGGER_URL
  const secret = process.env.PAPERCLIP_AGENT_SECRET

  if (!url || !secret) {
    console.warn(
      '[inquiry] PAPERCLIP_INQUIRY_TRIGGER_URL or PAPERCLIP_AGENT_SECRET not set — relying on Supabase webhook',
    )
    return
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
      record: { id: leadId, trigger: 'inquiry_verification' },
    }),
  }).catch(err => {
    console.error('[inquiry] Failed to trigger Paperclip inquiry verification:', err)
  })
}
