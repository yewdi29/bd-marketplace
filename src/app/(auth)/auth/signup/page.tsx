'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'

const COUNTRIES = [
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Trinidad and Tobago',
  'United Kingdom', 'Norway', 'Netherlands', 'Germany', 'France', 'Italy', 'Spain', 'Denmark', 'Romania', 'Poland',
  'Russia', 'Kazakhstan', 'Azerbaijan', 'Turkmenistan', 'Uzbekistan',
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Iran', 'Oman', 'Bahrain', 'Yemen',
  'Nigeria', 'Angola', 'Libya', 'Algeria', 'Egypt', 'Ghana', 'Mozambique', 'Congo', 'Gabon', 'Cameroon', 'Equatorial Guinea', 'South Sudan', 'Sudan',
  'Australia', 'Indonesia', 'Malaysia', 'Papua New Guinea', 'India', 'China', 'Vietnam', 'Myanmar',
  'Other',
]

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, companyName, city, state, country }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
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

    router.push('/auth/check-email')
  }

  const selectClass =
    'w-full px-4 py-2.5 text-[15px] font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors appearance-none cursor-pointer'

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <Image src="/bd_logo-black.svg" alt="Black Diamond" width={140} height={40} priority style={{ height: '27px', width: 'auto' }} />
          </Link>
          <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
            Create your account
          </h1>
          <p className="mt-2 text-[15px] font-sans text-ink-2">
            Start listing your equipment for free today!
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
              required
              autoComplete="organization"
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

            {/* Location fields */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="city"
                type="text"
                label="City"
                placeholder="Houston"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                autoComplete="address-level2"
              />
              <Input
                id="state"
                type="text"
                label="State / Province"
                placeholder="Texas"
                value={state}
                onChange={e => setState(e.target.value)}
                required
                autoComplete="address-level1"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-ink mb-1.5">
                Country <span className="text-orange">*</span>
              </label>
              <div className="relative">
                <select
                  id="country"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

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
      </div>
    </div>
  )
}
