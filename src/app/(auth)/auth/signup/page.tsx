'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/ui/BrandLogo'
import Input from '@/components/ui/Input'
import PhoneInput from '@/components/auth/PhoneInput'
import PasswordStrengthField from '@/components/auth/PasswordStrengthField'
import { createClient } from '@/lib/supabase/client'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'
import {
  clearAuthRedirect,
  consumeAuthRedirect,
  isSafeRedirectPath,
  resolveAuthRedirect,
  storeAuthRedirect,
} from '@/lib/authRedirect'

const COUNTRIES = [
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Trinidad and Tobago',
  'United Kingdom', 'Norway', 'Netherlands', 'Germany', 'France', 'Italy', 'Spain', 'Denmark', 'Romania', 'Poland',
  'Russia', 'Kazakhstan', 'Azerbaijan', 'Turkmenistan', 'Uzbekistan',
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Iran', 'Oman', 'Bahrain', 'Yemen',
  'Nigeria', 'Angola', 'Libya', 'Algeria', 'Egypt', 'Ghana', 'Mozambique', 'Congo', 'Gabon', 'Cameroon', 'Equatorial Guinea', 'South Sudan', 'Sudan',
  'Australia', 'Indonesia', 'Malaysia', 'Papua New Guinea', 'India', 'China', 'Vietnam', 'Myanmar',
  'Other',
]

const RESEND_COOLDOWN_SEC = 45

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-82px)] bg-bg" />}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const emailFromQuery = searchParams.get('email')?.trim() ?? ''
  const supabase = createClient()

  useEffect(() => {
    if (isSafeRedirectPath(redirectTo)) {
      storeAuthRedirect(redirectTo)
    } else {
      clearAuthRedirect()
    }
  }, [redirectTo])

  const loginHref = redirectTo && isSafeRedirectPath(redirectTo)
    ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}${
        emailFromQuery ? `&email=${encodeURIComponent(emailFromQuery)}` : ''
      }`
    : '/auth/login'

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(emailFromQuery)

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery)
  }, [emailFromQuery])
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const t = window.setTimeout(() => setResendSeconds(s => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendSeconds])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required.')
      return
    }
    if (!passwordMeetsRequirements(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      )
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName,
        companyName,
        city,
        state,
        country,
        phone: phone.trim(),
      }),
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), source: 'signup' }),
      })
    }

    // Confirmation OTP is sent by Supabase Auth → send-email-hook on signUp,
    // or via auth.resend when the email already had a pending signup.
    setStep('otp')
    setResendSeconds(RESEND_COOLDOWN_SEC)
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const token = otpCode.replace(/\D/g, '')
    if (token.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'signup',
    })

    if (verifyError) {
      setError(
        verifyError.message.includes('expired')
          ? 'That code has expired. Request a new one below.'
          : 'Invalid or expired code. Please try again or resend.',
      )
      setLoading(false)
      return
    }

    // Welcome email once account is confirmed (same path as prior confirm-email flow)
    try {
      await fetch('/api/auth/welcome-after-confirm', { method: 'POST' })
    } catch {
      // Non-fatal — account is confirmed either way
    }

    // Return to invite accept (or other post-auth destination) when present.
    const destination = resolveAuthRedirect(redirectTo, consumeAuthRedirect())
    router.push(destination)
    router.refresh()
  }

  async function handleResend() {
    if (resendSeconds > 0 || resending) return
    setResending(true)
    setError('')

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    })

    if (resendError) {
      setError(resendError.message || 'Could not resend the code. Please try again.')
      setResending(false)
      return
    }

    setResendSeconds(RESEND_COOLDOWN_SEC)
    setResending(false)
  }

  const selectClass =
    'w-full px-4 py-2.5 text-[15px] font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors appearance-none cursor-pointer'

  return (
    <div className="min-h-[calc(100vh-82px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <BrandLogo priority />
          </Link>
          {step === 'form' ? (
            <>
              <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
                Create your account
              </h1>
              <p className="mt-2 text-[15px] font-sans text-ink-2">
                Start listing your equipment for free today!
              </p>
            </>
          ) : (
            <>
              <h1 className="font-sans font-bold text-[32px] text-ink" style={{ letterSpacing: '-0.03em' }}>
                Confirm your account
              </h1>
              <p className="mt-2 text-[15px] font-sans text-ink-2">
                Enter the 6-digit code sent to your email.
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {step === 'form' ? (
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
                readOnly={Boolean(emailFromQuery)}
              />
              <PhoneInput value={phone} onChange={setPhone} required />
              <PasswordStrengthField value={password} onChange={setPassword} />

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
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <p className="text-sm font-sans text-ink-2 text-center leading-relaxed">
                Confirm your account — enter the 6-digit code sent to{' '}
                <span className="font-semibold text-ink">{email}</span>.
              </p>

              <div>
                <label htmlFor="otp_code" className="block text-sm font-sans font-medium text-ink mb-1.5">
                  Confirmation code
                </label>
                <input
                  id="otp_code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-white border border-[#D4D5D7] text-ink placeholder:text-ink-3 px-4 py-3 text-center text-2xl font-sans font-bold tracking-[0.35em] rounded-[10px] focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm account'}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendSeconds > 0 || resending}
                  className="text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors disabled:text-ink-3 disabled:cursor-not-allowed"
                >
                  {resending
                    ? 'Sending…'
                    : resendSeconds > 0
                      ? `Resend code in ${resendSeconds}s`
                      : 'Resend code'}
                </button>
                <p className="text-xs font-sans text-ink-3">
                  Wrong email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form')
                      setOtpCode('')
                      setError('')
                    }}
                    className="font-semibold text-ink hover:text-orange transition-colors"
                  >
                    Go back
                  </button>
                </p>
              </div>
            </form>
          )}

          {step === 'form' && (
            <div className="mt-6 text-center">
              <p className="text-sm font-sans text-ink-3">
                Already have an account?{' '}
                <Link href={loginHref} className="font-semibold text-orange hover:text-orange-lt transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
