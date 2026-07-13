'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function establishRecoverySession() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (!cancelled) {
            setError('This reset link is invalid or has expired. Please request a new one.')
            setCheckingLink(false)
          }
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) {
        if (session) {
          setReady(true)
        } else {
          setError('This reset link is invalid or has expired. Please request a new one.')
        }
        setCheckingLink(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
        setCheckingLink(false)
        setError('')
      }
    })

    void establishRecoverySession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- singleton Supabase browser client
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

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
            Choose a new password
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Enter a new password for your account.
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {checkingLink ? (
            <p className="text-sm font-sans text-ink-2 text-center">Verifying your reset link…</p>
          ) : !ready ? (
            <div className="space-y-6 text-center">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="password"
                type="password"
                label="New Password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
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
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
