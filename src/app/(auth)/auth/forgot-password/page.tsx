'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <Image
              src="/bd_logo-black.svg"
              alt="Black Diamond"
              width={140}
              height={40}
              priority
              style={{ height: '27px', width: 'auto' }}
            />
          </Link>
          <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
            Reset your password
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            {sent
              ? 'If an account exists for that email, we sent a reset link.'
              : 'Enter your email and we\u2019ll send you a link to choose a new password.'}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {sent ? (
            <div className="space-y-6 text-center">
              <p className="text-sm font-sans text-ink-2 leading-relaxed">
                Check your inbox and spam folder. The link expires after a short time.
              </p>
              <Link
                href="/auth/login"
                className="block w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm font-sans text-ink-3 hover:text-ink transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
