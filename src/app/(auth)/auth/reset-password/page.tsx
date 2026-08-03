'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/ui/BrandLogo'
import Input from '@/components/ui/Input'
import PasswordStrengthField from '@/components/auth/PasswordStrengthField'
import { createClient } from '@/lib/supabase/client'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-82px)] bg-bg" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Hold token inertly from the email link — never verify on GET/load (scanner-safe).
  const tokenHash = searchParams.get('token_hash')?.trim() ?? ''
  const type = searchParams.get('type')?.trim() ?? 'recovery'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasToken = Boolean(tokenHash) && type === 'recovery'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!hasToken) {
      setError('This reset link is invalid or incomplete. Request a new one.')
      return
    }

    if (!passwordMeetsRequirements(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      )
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    // Verify token + establish recovery session only on intentional form submit.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })

    if (verifyError) {
      setError(
        verifyError.message.includes('expired')
          ? 'This reset link has expired. Request a new one.'
          : 'This reset link is invalid or has already been used. Request a new one.',
      )
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
            Choose a new password
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Enter a new password for your account.
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {!hasToken ? (
            <div className="space-y-6 text-center">
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-sans text-red-600">
                  This reset link is invalid or incomplete. Request a new password reset email.
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordStrengthField
                id="password"
                label="New Password"
                value={password}
                onChange={setPassword}
              />
              <Input
                id="confirm_password"
                type="password"
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />

              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
