'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CompanyAvatar from '@/components/ui/CompanyAvatar'
import { useRouter } from 'next/navigation'
import type { MembershipPlan } from '@/lib/types/database'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
]

interface UserProfile {
  email: string
  full_name: string | null
  company_name: string | null
  company_logo_url: string | null
  phone: string | null
  city: string | null
  state: string | null
  country: string | null
}

const inputClass =
  'w-full bg-white border border-[#D4D5D7] rounded-[10px] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 font-sans focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors'
const labelClass = 'block text-sm font-medium text-ink mb-1.5'
const sectionHeadingClass =
  'text-[11px] font-sans font-semibold uppercase tracking-wider mb-5'
const spinnerPath =
  'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d={spinnerPath} />
    </svg>
  )
}

function SaveButton({ loading, disabled, label }: { loading: boolean; disabled?: boolean; label: string }) {
  const isDisabled = loading || disabled
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-pill transition-colors disabled:cursor-not-allowed"
      style={{
        background: isDisabled ? '#E8E9EA' : '#FF6B35',
        color: isDisabled ? '#9A9DA2' : '#FFFFFF',
        boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(255,107,53,0.25)',
      }}
    >
      {loading && <Spinner />}
      {label}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 mb-5">
      <p className="text-sm font-sans text-red-600">{message}</p>
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [stateField, setStateField] = useState('')
  const [country, setCountry] = useState('')

  // Snapshot of last-saved values — used to detect unsaved changes
  const [savedState, setSavedState] = useState({
    firstName: '', lastName: '', phone: '', companyName: '', city: '', stateField: '', country: '',
  })

  const isDirty =
    firstName !== savedState.firstName ||
    lastName !== savedState.lastName ||
    phone !== savedState.phone ||
    companyName !== savedState.companyName ||
    city !== savedState.city ||
    stateField !== savedState.stateField ||
    country !== savedState.country

  // Membership state
  const [plan, setPlan] = useState<MembershipPlan>('free')

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: planData } = await supabase.from('users').select('plan').eq('id', authUser.id).single()
          if (planData?.plan) setPlan(planData.plan as MembershipPlan)
        }

        const res = await fetch('/api/users/me')
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json() as { user: UserProfile }
        const u = data.user
        setProfile(u)
        const parts = (u.full_name ?? '').split(' ')
        const fn = parts[0] ?? ''
        const ln = parts.slice(1).join(' ')
        const ph = u.phone ?? ''
        const co = u.company_name ?? ''
        const ci = u.city ?? ''
        const st = u.state ?? ''
        const ct = u.country ?? 'United States'
        setFirstName(fn)
        setLastName(ln)
        setPhone(ph)
        setCompanyName(co)
        setCity(ci)
        setStateField(st)
        setCountry(ct)
        setLogoUrl(u.company_logo_url ?? null)
        setSavedState({ firstName: fn, lastName: ln, phone: ph, companyName: co, city: ci, stateField: st, country: ct })
      } catch {
        setLoadError('Failed to load your profile. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleLogoRemove() {
    setLogoError(null)
    setLogoUploading(true)
    try {
      const res = await fetch('/api/users/logo', { method: 'DELETE' })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || json.error) {
        setLogoError(json.error ?? 'Failed to remove logo')
        return
      }
      setLogoUrl(null)
      showToast('Logo removed')
    } catch {
      setLogoError('Failed to remove logo. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    setLogoUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/users/logo', { method: 'POST', body: form })
      const json = await res.json() as { success?: boolean; url?: string; error?: string }
      if (!res.ok || json.error) {
        setLogoError(json.error ?? 'Upload failed')
        return
      }
      setLogoUrl(json.url ?? null)
      showToast('Logo updated')
    } catch {
      setLogoError('Upload failed. Please try again.')
    } finally {
      setLogoUploading(false)
      // Reset input so the same file can be re-selected if needed
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileError(null)
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || null,
          phone: phone.trim() || null,
          company_name: companyName.trim() || null,
          city: city.trim() || null,
          state: stateField || null,
          country: country.trim() || null,
        }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || json.error) {
        setProfileError(json.error ?? 'Failed to save settings')
        return
      }
      // Re-sync snapshot so button returns to disabled state
      setSavedState({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        city: city.trim(),
        stateField,
        country: country.trim(),
      })
      showToast('Settings saved')
    } catch {
      setProfileError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setSavingPassword(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email ?? '',
        password: currentPassword,
      })
      if (signInError) {
        setPasswordError('Current password is incorrect')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setPasswordError(updateError.message)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password updated')
    } catch {
      setPasswordError('Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <div className="h-7 w-48 bg-[#F0F0F0] rounded-[10px] animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 bg-[#F0F0F0] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <ErrorBanner message={loadError} />
      </div>
    )
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8">
      <h1 className="font-sans font-bold text-ink mb-8" style={{ fontSize: '20px' }}>
        Account Settings
      </h1>

      {/* ── Personal + Company form ── */}
      <form onSubmit={handleSaveProfile}>

        {/* Section 1: Personal Information */}
        <section className="mb-8">
          <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
            Personal Information
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              readOnly
              className="w-full bg-[#F7F8F9] border border-[#E8E9EA] rounded-[10px] px-3.5 py-2.5 text-sm font-sans cursor-not-allowed"
              style={{ color: '#9A9DA2' }}
            />
            <p className="text-xs text-ink-3 mt-1.5 font-sans">Contact support to change your email</p>
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={inputClass}
            />
          </div>
        </section>

        <div className="border-t border-[#E8E9EA] mb-8" />

        {/* Section 2: Company Information */}
        <section className="mb-8">
          <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
            Company Information
          </p>

          {/* Logo upload */}
          <div className="flex items-center gap-5 mb-6">
            {/* Logo preview */}
            <div className="relative shrink-0">
              {logoUploading ? (
                <div
                  className="w-[72px] h-[72px] bg-[#F7F8F9] border border-[#E8E9EA] flex items-center justify-center"
                  style={{ borderRadius: '12px' }}
                >
                  <svg className="w-5 h-5 animate-spin text-orange" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <CompanyAvatar
                  logoUrl={logoUrl}
                  companyName={companyName || null}
                  size={72}
                />
              )}

            </div>

            {/* Upload / Remove button + hint */}
            <div className="flex flex-col gap-1.5">
              {logoUrl ? (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  disabled={logoUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-pill transition-colors disabled:opacity-50"
                  style={{ background: '#FFF0F0', color: '#CC0000', border: '1px solid #FFCCCC' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Logo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Logo
                </button>
              )}
              <p className="text-xs text-ink-3 font-sans">PNG or JPG · Max 5 MB</p>
              {logoError && <p className="text-xs text-red-500 font-sans">{logoError}</p>}
            </div>

            {/* Hidden file input */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Your company name"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <div className="relative">
                <select
                  value={stateField}
                  onChange={e => setStateField(e.target.value)}
                  className={inputClass + ' appearance-none pr-8'}
                >
                  <option value="">Select state</option>
                  {US_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="Country"
              className={inputClass}
            />
          </div>
        </section>

        {profileError && <ErrorBanner message={profileError} />}

        <SaveButton loading={saving} disabled={!isDirty} label="Save Changes" />
      </form>

      <div className="border-t border-[#E8E9EA] my-8" />

      {/* ── Section 3: Change Password ── */}
      <form onSubmit={handleChangePassword}>
        <section className="mb-6">
          <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
            Change Password
          </p>

          <div className="mb-4">
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          <div className="mb-4">
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          {passwordError && <ErrorBanner message={passwordError} />}

          <SaveButton loading={savingPassword} label="Update Password" />
        </section>
      </form>

      <div className="border-t border-[#E8E9EA] my-8" />

      {/* ── Section 4: Membership ── */}
      <section className="mb-8">
        <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
          Membership
        </p>

        <div
          className="flex items-center justify-between p-4 rounded-[14px] border"
          style={{ borderColor: '#E8E9EA', background: '#FAFAFA' }}
        >
          <div className="flex items-center gap-3">
            {/* Plan badge */}
            <span
              className="inline-flex items-center px-3 py-1.5 text-[11px] font-mono font-bold rounded-pill border"
              style={
                plan === 'max'
                  ? { background: '#1A1D20', color: '#FFFFFF', borderColor: '#1A1D20' }
                  : plan === 'pro' || plan === 'premium'
                    ? { background: '#FDF6E3', color: '#7A5C00', borderColor: '#F0D98A' }
                    : plan === 'starter'
                      ? { background: '#F4F4F5', color: '#52525B', borderColor: '#E4E4E7' }
                      : { background: '#FFF2ED', color: '#FF6B35', borderColor: '#FFD4C2' }
              }
            >
              {plan === 'max' ? 'MAX' : plan === 'pro' ? 'PRO' : plan === 'starter' ? 'STARTER' : plan === 'premium' ? 'PREMIUM' : 'FREE'}
            </span>

            {/* Limit description */}
            <div>
              <p className="text-sm font-semibold text-ink capitalize">{plan === 'premium' ? 'Premium (Legacy)' : plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</p>
              <p className="text-xs text-ink-3 font-sans">
                {plan === 'max' || plan === 'premium'
                  ? 'Unlimited active listings'
                  : plan === 'pro'
                    ? '40 active listings'
                    : plan === 'starter'
                      ? '15 active listings'
                      : '3 active listings'}
              </p>
            </div>
          </div>

          {/* CTA */}
          {plan === 'max' ? (
            <button
              onClick={() => { showToast('Billing management coming soon.') }}
              className="px-4 py-2 text-sm font-semibold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] hover:text-ink transition-colors"
            >
              Manage Billing
            </button>
          ) : (
            <button
              onClick={() => router.push('/dashboard/upgrade')}
              className="px-4 py-2 text-sm font-bold text-white rounded-pill transition-colors"
              style={{ background: '#FF6B35', boxShadow: '0 4px 14px rgba(255,107,53,0.28)' }}
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div
            className="flex items-center gap-2 bg-ink text-white text-sm font-sans px-5 py-3 rounded-pill"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-4 h-4 shrink-0 text-[#A2FF9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
