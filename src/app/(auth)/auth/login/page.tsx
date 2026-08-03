'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/ui/BrandLogo'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import {
  clearAuthRedirect,
  isSafeRedirectPath,
  resolveAuthRedirect,
  storeAuthRedirect,
} from '@/lib/authRedirect'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('redirectTo')
  const signupHref = redirectTo && isSafeRedirectPath(redirectTo)
    ? `/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`
    : '/auth/signup'

  useEffect(() => {
    if (isSafeRedirectPath(redirectTo)) {
      storeAuthRedirect(redirectTo)
    } else {
      // Plain Sign In (no intentional return URL) — always land on dashboard.
      clearAuthRedirect()
    }
  }, [redirectTo])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Prefer an explicit ?redirectTo= (e.g. save/inquiry). Otherwise dashboard.
    const destination = resolveAuthRedirect(redirectTo, null)
    clearAuthRedirect()
    router.push(destination)
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
            Welcome Back
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Sign in to your marketplace account
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleLogin} className="space-y-5">
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
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="block text-sm font-sans text-ink-3 hover:text-ink transition-colors"
            >
              Forgot your password?
            </Link>
            <p className="text-sm font-sans text-ink-3">
              No account?{' '}
              <Link href={signupHref} className="font-semibold text-orange hover:text-orange-lt transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-82px)] bg-bg" />}>
      <LoginForm />
    </Suspense>
  )
}
