'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/ui/BrandLogo'
import { createClient } from '@/lib/supabase/client'
import { resolveAuthRedirect } from '@/lib/authRedirect'

function ConfirmEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenHash = searchParams.get('token_hash') ?? ''
  const type = searchParams.get('type') ?? 'signup'
  const email = searchParams.get('email') ?? ''

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMessage, setResendMessage] = useState('')

  const missingParams = !tokenHash || type !== 'signup'

  async function handleConfirm() {
    if (missingParams) return
    setLoading(true)
    setError('')
    setResendMessage('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    })

    if (verifyError) {
      setError(
        verifyError.message.includes('expired')
          ? 'This confirmation link has expired. Request a new one below.'
          : 'This confirmation link is invalid or has already been used. Request a new one below.',
      )
      setLoading(false)
      return
    }

    // Fire-and-forget branded welcome (same as /auth/callback after confirm).
    void fetch('/api/auth/welcome-after-confirm', { method: 'POST' }).catch(() => {})

    const destination = resolveAuthRedirect(null, null)
    router.push(destination)
    router.refresh()
  }

  async function handleResend() {
    if (!email) {
      setError('We could not determine your email. Please sign up again or contact support.')
      return
    }
    setResending(true)
    setError('')
    setResendMessage('')

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (resendError) {
      setError(resendError.message)
      setResending(false)
      return
    }

    setResendMessage('A new confirmation email is on the way. Check your inbox.')
    setResending(false)
  }

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <BrandLogo priority />
          </Link>
          <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
            Confirm your email
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Click below to confirm your email address and activate your account.
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {missingParams ? (
            <div className="space-y-6 text-center">
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-sans text-red-600">
                  This confirmation link is incomplete or invalid.
                </p>
              </div>
              <Link
                href="/auth/signup"
                className="block w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
              >
                Back to Create Account
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}
              {resendMessage && (
                <div className="rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
                  <p className="text-sm font-sans text-[#166534]">{resendMessage}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={loading}
                className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm Email'}
              </button>

              {error && (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending || !email}
                  className="w-full py-3 text-sm font-bold text-ink bg-white border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Request a new confirmation email'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-82px)] bg-bg" />}>
      <ConfirmEmailForm />
    </Suspense>
  )
}
