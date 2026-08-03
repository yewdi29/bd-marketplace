# send-email-hook

Thin Supabase Edge Function relay for the Auth **Send Email Hook** (HTTPS).

| `email_action_type` | Next.js route | Template |
|---------------------|---------------|----------|
| `signup` | `POST /api/auth/confirmation-email` | `AuthConfirmation` |
| `recovery` | `POST /api/auth/password-reset-email` | `AuthPasswordReset` |
| anything else | (no send — return 200) | — |

## Secrets (two different trust relationships)

| Secret | Where set | Purpose |
|--------|-----------|---------|
| `SEND_EMAIL_HOOK_SECRET` | Supabase Dashboard (Auth → Hooks → Generate Secret) **and** Edge Function secrets | Supabase Auth → this Edge Function (Standard Webhooks). Format: `v1,whsec_...` |
| `AUTH_EMAIL_RELAY_SECRET` | Edge Function secrets **and** Vercel / `.env.local` | Edge Function → Next.js API (`x-auth-email-relay-secret` header). Same secret for both signup and recovery routes. |

Optional Edge Function env overrides:

| Env | Default |
|-----|---------|
| `AUTH_EMAIL_API_URL` | `https://blackdiamondmkt.com/api/auth/confirmation-email` |
| `AUTH_PASSWORD_RESET_EMAIL_API_URL` | `https://blackdiamondmkt.com/api/auth/password-reset-email` |

`SUPABASE_URL` is auto-provided to Edge Functions (used to build `/auth/v1/verify?...` links).

## Deploy

```bash
supabase functions deploy send-email-hook --no-verify-jwt

supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_YOUR_DASHBOARD_SECRET"
supabase secrets set AUTH_EMAIL_RELAY_SECRET="YOUR_RANDOM_RELAY_SECRET"
# optional overrides:
# supabase secrets set AUTH_EMAIL_API_URL="https://blackdiamondmkt.com/api/auth/confirmation-email"
# supabase secrets set AUTH_PASSWORD_RESET_EMAIL_API_URL="https://blackdiamondmkt.com/api/auth/password-reset-email"
```

## Dashboard step (manual)

1. Authentication → Hooks → Send Email Hook → HTTPS
2. Paste the deployed function URL, e.g.  
   `https://<project-ref>.supabase.co/functions/v1/send-email-hook`
3. Paste / generate `SEND_EMAIL_HOOK_SECRET` and save

## Important: SMTP is replaced

When this hook is **enabled**, Supabase does **not** use SMTP for any auth
email. This function sends branded mail for `signup` and `recovery` only.
Other types (`magiclink`, `email_change`, etc.) return 200 without sending.
