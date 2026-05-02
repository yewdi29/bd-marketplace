'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-display text-3xl tracking-widest text-gold">CHECK YOUR EMAIL</h2>
          <p className="mt-3 font-body text-sm text-gray-400 leading-relaxed">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block">
            <Button variant="outline" size="md">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-widest text-gold">
            BLACK DIAMOND
          </Link>
          <h1 className="mt-4 font-display text-4xl tracking-widest text-white">CREATE ACCOUNT</h1>
          <p className="mt-2 font-body text-sm text-gray-500">
            Free to join. List up to 3 pieces of equipment.
          </p>
        </div>

        <div className="bg-surface border border-surface-border p-8">
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

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={e => setNewsletter(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-gold cursor-pointer"
              />
              <span className="text-xs font-body text-gray-400 leading-relaxed">
                Subscribe to the Black Diamond newsletter for market updates, new listings, and exclusive promotions.
              </span>
            </label>

            {error && (
              <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm font-body text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-display tracking-widest"
            >
              CREATE FREE ACCOUNT
            </Button>

            <p className="text-xs font-body text-gray-600 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-gray-400 hover:text-gold">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-gray-400 hover:text-gold">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gold hover:text-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { plan: 'FREE', features: ['Up to 3 listings', 'Direct buyer contact', 'Green tier support'] },
            { plan: 'PREMIUM', features: ['Unlimited listings', 'Priority placement', 'Full broker support'] },
          ].map(p => (
            <div key={p.plan} className="border border-surface-border p-4 bg-surface">
              <div className={`font-display text-sm tracking-widest mb-3 ${p.plan === 'PREMIUM' ? 'text-gold' : 'text-gray-400'}`}>
                {p.plan}
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-body text-gray-500">
                    <span className="text-gold">✓</span> {f}
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
