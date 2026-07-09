import { Resend } from 'resend'

export const EMAIL_FROM = 'no-reply@blackdiamonddrilling.com'

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  from?: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping:', opts.subject)
    return
  }
  await resend.emails.send({
    from: opts.from ?? EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  })
}

export function emailLayout(title: string, body: string): string {
  return `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#0F1117;">
      <h2 style="color:#0F1117;margin-top:0;font-size:20px;font-weight:600;">${title}</h2>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#9CA3AF;">Black Diamond Marketplace</p>
    </div>
  `
}

export function blockquote(text: string): string {
  return `
    <div style="background:#F8F9FA;border-left:4px solid #FF6B35;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:#0F1117;white-space:pre-wrap;">${escapeHtml(text)}</p>
    </div>
  `
}

export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;color:#6B7280;font-size:13px;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#0F1117;font-size:14px;">${value}</td>
    </tr>
  `
}

export function tierBadge(tier: 'green' | 'yellow' | 'red'): string {
  const colors = {
    green: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Green — Self-Service' },
    yellow: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Yellow — Assisted' },
    red: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Red — White Glove' },
  }
  const c = colors[tier]
  return `<span style="display:inline-block;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;color:${c.text};background:${c.bg};border:1px solid ${c.border};">${c.label}</span>`
}
