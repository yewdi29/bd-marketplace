'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/ui/BrandLogo'
import { createClient } from '@/lib/supabase/client'

function ConfirmResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenHash = searchParams.get('token_hash') ?? ''
  const type = searchParams.get('type') ?? 'recovery'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const missingParams = !tokenHash || type !== 'recovery'

  async function handleContinue() {
    if (missingParams) return
    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })

    if (verifyError) {
      setError(
        verifyError.message.includes('expired')
          ? 'This reset link has expired. Request a new one below.'
          : 'This reset link is invalid or has already been used. Request a new one below.',
      )
      setLoading(false)
      return
    }

    // Recovery session is established — password form does not need a consuming ?code=.
    router.push('/auth/reset-password')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <BrandLogo priority />
          </Link>
          <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
            Reset your password
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Click below to continue. You&apos;ll choose a new password on the next page.
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {missingParams ? (
            <div className="space-y-6 text-center">
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-sans text-red-600">
                  This reset link is incomplete or invalid.
                </p>
              </div>
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleContinue()}
                disabled={loading}
                className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50"
              >
                {loading ? 'Continuing...' : 'Continue to Reset Password'}
              </button>

              {error && (
                <Link
                  href="/auth/forgot-password"
                  className="block w-full py-3 text-center text-sm font-bold text-ink bg-white border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors"
                >
                  Request a new link
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmResetPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-82px)] bg-bg" />}>
      <ConfirmResetForm />
    </Suspense>
  )
}
