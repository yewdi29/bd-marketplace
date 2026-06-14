import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  listing: 'Listing Support',
  membership: 'Membership',
  partnership: 'Partnership',
  other: 'Other',
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, subject, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const subjectLabel = SUBJECT_LABELS[subject] ?? subject ?? 'General Inquiry'
    const emailSubject = `[BD Marketplace] ${subjectLabel} — from ${name}`

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: 'noreply@contact.blackdiamonddrilling.com',
        to: 'contact@blackdiamondmarketplace.com',
        subject: emailSubject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h2 style="color:#1A1D20;margin-top:0;">${emailSubject}</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:8px 0;color:#9A9DA2;font-size:13px;width:120px;">Name</td>
                <td style="padding:8px 0;color:#1A1D20;font-size:14px;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#9A9DA2;font-size:13px;">Email</td>
                <td style="padding:8px 0;color:#1A1D20;font-size:14px;"><a href="mailto:${email}" style="color:#FF6B35;">${email}</a></td>
              </tr>
              ${company ? `<tr>
                <td style="padding:8px 0;color:#9A9DA2;font-size:13px;">Company</td>
                <td style="padding:8px 0;color:#1A1D20;font-size:14px;">${company}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:8px 0;color:#9A9DA2;font-size:13px;">Subject</td>
                <td style="padding:8px 0;color:#1A1D20;font-size:14px;">${subjectLabel}</td>
              </tr>
            </table>
            <div style="background:#F7F8F9;border-radius:10px;padding:20px;">
              <p style="margin:0;color:#1A1D20;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
