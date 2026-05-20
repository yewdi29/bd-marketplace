'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

function SaveButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-60"
      style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
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

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json() as { user: UserProfile }
        const u = data.user
        setProfile(u)
        const parts = (u.full_name ?? '').split(' ')
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setPhone(u.phone ?? '')
        setCompanyName(u.company_name ?? '')
        setCity(u.city ?? '')
        setStateField(u.state ?? '')
        setCountry(u.country ?? 'United States')
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

        <SaveButton loading={saving} label="Save Changes" />
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
