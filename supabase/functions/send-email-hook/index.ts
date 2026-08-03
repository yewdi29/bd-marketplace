/**
 * Thin relay for Supabase Auth "Send Email" Hook (HTTPS).
 *
 * - Verifies Standard Webhooks signature (SEND_EMAIL_HOOK_SECRET)
 * - Relays email_action_type "signup" → POST /api/auth/confirmation-email
 * - Relays email_action_type "recovery" → POST /api/auth/password-reset-email
 * - All other action types: acknowledge with 200 and do not send
 *   (enabling this hook disables SMTP for ALL auth emails)
 *
 * Auth via AUTH_EMAIL_RELAY_SECRET (x-auth-email-relay-secret header).
 * No React Email rendering. No Resend calls.
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

type SendEmailHookPayload = {
  user: {
    id?: string
    email?: string
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new?: string
    token_hash_new?: string
  }
}

type HandledAction = 'signup' | 'recovery'

const DEFAULT_API_BASE = 'https://blackdiamondmkt.com'

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildVerifyUrl(
  supabaseUrl: string,
  emailData: SendEmailHookPayload['email_data'],
): string {
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  })
  return `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify?${params.toString()}`
}

function resolveApiUrl(actionType: HandledAction): string {
  if (actionType === 'signup') {
    return (
      Deno.env.get('AUTH_EMAIL_API_URL') ??
      `${DEFAULT_API_BASE}/api/auth/confirmation-email`
    )
  }

  return (
    Deno.env.get('AUTH_PASSWORD_RESET_EMAIL_API_URL') ??
    `${DEFAULT_API_BASE}/api/auth/password-reset-email`
  )
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const hookSecretRaw = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!hookSecretRaw) {
    console.error('[send-email-hook] SEND_EMAIL_HOOK_SECRET is not set')
    return jsonResponse(
      { error: { http_code: 500, message: 'Hook secret not configured' } },
      500,
    )
  }

  // Dashboard secret format: v1,whsec_<base64> — standardwebhooks expects the base64 part.
  const hookSecret = hookSecretRaw.replace(/^v1,whsec_/, '')
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let verified: SendEmailHookPayload
  try {
    const wh = new Webhook(hookSecret)
    verified = wh.verify(payload, headers) as SendEmailHookPayload
  } catch (err) {
    console.error('[send-email-hook] signature verification failed:', err)
    return jsonResponse(
      { error: { http_code: 401, message: 'Invalid webhook signature' } },
      401,
    )
  }

  const actionType = verified.email_data?.email_action_type

  if (actionType !== 'signup' && actionType !== 'recovery') {
    console.warn(
      `[send-email-hook] ignoring email_action_type="${actionType}" ` +
        '(handled: signup, recovery only). ' +
        'NOTE: with Send Email Hook enabled, SMTP is not used — unhandled auth emails will not send.',
    )
    return jsonResponse({})
  }

  const email = verified.user?.email?.trim()
  if (!email) {
    console.error(`[send-email-hook] ${actionType} payload missing user.email`)
    return jsonResponse(
      { error: { http_code: 400, message: 'Missing user email' } },
      400,
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) {
    console.error('[send-email-hook] SUPABASE_URL is not set')
    return jsonResponse(
      { error: { http_code: 500, message: 'SUPABASE_URL not configured' } },
      500,
    )
  }

  const relaySecret = Deno.env.get('AUTH_EMAIL_RELAY_SECRET')
  if (!relaySecret) {
    console.error('[send-email-hook] AUTH_EMAIL_RELAY_SECRET is not set')
    return jsonResponse(
      { error: { http_code: 500, message: 'Relay secret not configured' } },
      500,
    )
  }

  const verifyUrl = buildVerifyUrl(supabaseUrl, verified.email_data)
  const apiUrl = resolveApiUrl(actionType)

  const body =
    actionType === 'signup'
      ? {
          email,
          confirmationUrl: verifyUrl,
          userId: verified.user.id ?? null,
        }
      : {
          email,
          resetUrl: verifyUrl,
          userId: verified.user.id ?? null,
        }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-email-relay-secret': relaySecret,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const resBody = await res.text().catch(() => '')
      console.error(
        `[send-email-hook] Next.js relay failed for ${actionType}:`,
        res.status,
        resBody,
      )
      return jsonResponse(
        {
          error: {
            http_code: 502,
            message: `Failed to send branded ${actionType} email`,
          },
        },
        502,
      )
    }
  } catch (err) {
    console.error(`[send-email-hook] Next.js relay request error for ${actionType}:`, err)
    return jsonResponse(
      {
        error: {
          http_code: 502,
          message: 'Failed to reach auth email API',
        },
      },
      502,
    )
  }

  return jsonResponse({})
})
