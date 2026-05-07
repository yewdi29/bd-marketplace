'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (newsletter) {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'signup' }),
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 bg-bg">
        <div className="w-full max-w-md text-center bg-white rounded-[20px] p-10" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-sans font-extrabold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>Check your email</h2>
          <p className="mt-3 text-[15px] font-sans text-ink-2 leading-relaxed">
            We sent a confirmation link to <strong className="text-ink">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block px-6 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-ink flex items-center justify-center" style={{ borderRadius: '8px' }}>
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
              </svg>
            </div>
            <span className="font-sans font-bold text-base tracking-tight text-ink">BLACK DIAMOND</span>
          </Link>
          <h1 className="font-sans font-extrabold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
            Create your account
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Free to join. List up to 3 pieces of equipment.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSignup} className="space-y-5">
            <Input
              id="full_name"
              type="text"
              label="Full Name"
              placeholder="John Smith"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              id="company_name"
              type="text"
              label="Company Name"
              placeholder="Permian Basin Drilling Co."
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
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
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />

            {/* Newsletter checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={e => setNewsletter(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-orange cursor-pointer"
              />
              <span className="text-sm font-sans text-ink-3 leading-relaxed">
                Subscribe to the Black Diamond newsletter for market updates, new listings, and exclusive promotions.
              </span>
            </label>

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
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>

            <p className="text-xs font-sans text-ink-3 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-ink hover:text-orange transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-ink hover:text-orange transition-colors">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-sans text-ink-3">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-orange hover:text-orange-lt transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { plan: 'FREE', features: ['Up to 3 listings', 'Direct buyer contact', 'Standard support'] },
            { plan: 'PREMIUM', features: ['Unlimited listings', 'Priority placement', 'Full broker support'] },
          ].map(p => (
            <div key={p.plan} className="bg-white border border-[#E8E9EA] rounded-[16px] p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className={`text-xs font-sans font-bold uppercase tracking-wider mb-3 ${p.plan === 'PREMIUM' ? 'text-orange' : 'text-ink-3'}`}>
                {p.plan}
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-sans text-ink-3">
                    <span className="text-orange font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
