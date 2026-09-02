'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import CompanyAvatar from '@/components/ui/CompanyAvatar'
import { useRouter } from 'next/navigation'
import type { MembershipPlan } from '@/lib/types/database'
import PlanBadge, { EnterpriseBadge } from '@/components/ui/PlanBadge'
import { DashboardSettingsShell } from '@/components/dashboard/DashboardSettingsShell'
import PasswordStrengthField from '@/components/auth/PasswordStrengthField'
import PasswordInput from '@/components/auth/PasswordInput'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'
import type { OrgMembership } from '@/lib/organizations/auth'
import {
  managerHasBillingAccess,
  managerHasProfileEditAccess,
} from '@/lib/organizations/managerPermissions'

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

const readOnlyInputClass =
  'w-full bg-[#F7F8F9] border border-[#E8E9EA] rounded-[10px] px-3.5 py-2.5 text-sm font-sans cursor-not-allowed'
const orgDeferredClass = 'opacity-60 pointer-events-none select-none'

interface OrgOrganization {
  id: string
  name: string
  logo_url: string | null
  description: string | null
}

interface OrgBillingDisplay {
  planName: string
  billingInterval: 'monthly' | 'annual' | null
}

function OrgDeferredMessage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="text-xs text-ink-3 mt-4 font-sans leading-relaxed pointer-events-auto">
      {children}
    </p>
  )
}

function CompanySettingsLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-ink-2 underline hover:text-ink transition-colors">
      {children}
    </Link>
  )
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

  // Membership state
  const [plan, setPlan] = useState<MembershipPlan>('free')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual' | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Organization deferral (display-only — personal DB fields untouched)
  const [orgMembership, setOrgMembership] = useState<OrgMembership | null>(null)
  const [orgOrganization, setOrgOrganization] = useState<OrgOrganization | null>(null)
  const [orgBillingDisplay, setOrgBillingDisplay] = useState<OrgBillingDisplay | null>(null)

  const isOrgMember = Boolean(orgMembership && orgOrganization)
  const canEditOrgProfile = orgMembership ? managerHasProfileEditAccess(orgMembership) : false
  const canAccessOrgBilling = orgMembership ? managerHasBillingAccess(orgMembership) : false

  const isDirty = isOrgMember
    ? (
      firstName !== savedState.firstName ||
      lastName !== savedState.lastName ||
      phone !== savedState.phone
    )
    : (
      firstName !== savedState.firstName ||
      lastName !== savedState.lastName ||
      phone !== savedState.phone ||
      companyName !== savedState.companyName ||
      city !== savedState.city ||
      stateField !== savedState.stateField ||
      country !== savedState.country
    )

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const canUpdatePassword =
    currentPassword.length > 0 &&
    passwordMeetsRequirements(newPassword) &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: planData } = await supabase.from('users').select('plan, billing_period').eq('id', authUser.id).single()
          if (planData?.plan) setPlan(planData.plan as MembershipPlan)
          if (planData?.billing_period) setBillingPeriod(planData.billing_period as 'monthly' | 'annual')
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

        const orgRes = await fetch('/api/organizations/me')
        if (orgRes.ok) {
          const orgData = await orgRes.json() as {
            membership?: OrgMembership | null
            organization?: OrgOrganization | null
            billingDisplay?: OrgBillingDisplay | null
          }
          if (orgData.membership && orgData.organization) {
            setOrgMembership(orgData.membership)
            setOrgOrganization(orgData.organization)
            setOrgBillingDisplay(orgData.billingDisplay ?? null)
          }
        }
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

  async function handleManageBilling() {
    setPortalError(null)
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setPortalError(data.error ?? 'Could not open billing portal. Please try again.')
        return
      }
      window.location.href = data.url
    } catch {
      setPortalError('Network error. Please check your connection and try again.')
    } finally {
      setPortalLoading(false)
    }
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
      const payload: Record<string, string | null> = {
        full_name: fullName || null,
        phone: phone.trim() || null,
      }
      if (!isOrgMember) {
        payload.company_name = companyName.trim() || null
        payload.city = city.trim() || null
        payload.state = stateField || null
        payload.country = country.trim() || null
      }
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        companyName: isOrgMember ? savedState.companyName : companyName.trim(),
        city: isOrgMember ? savedState.city : city.trim(),
        stateField: isOrgMember ? savedState.stateField : stateField,
        country: isOrgMember ? savedState.country : country.trim(),
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
    if (!passwordMeetsRequirements(newPassword)) {
      setPasswordError(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      )
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setPasswordError(data.error ?? 'Failed to update password')
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
      <DashboardSettingsShell>
        <div className="h-7 w-48 bg-[#F0F0F0] rounded-[10px] animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 bg-[#F0F0F0] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </DashboardSettingsShell>
    )
  }

  if (loadError) {
    return (
      <DashboardSettingsShell>
        <ErrorBanner message={loadError} />
      </DashboardSettingsShell>
    )
  }

  return (
    <DashboardSettingsShell>
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

          {isOrgMember && orgOrganization ? (
            <>
              <div className={orgDeferredClass}>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative shrink-0">
                    {orgOrganization.logo_url ? (
                      <Image
                        src={orgOrganization.logo_url}
                        alt=""
                        width={112}
                        height={112}
                        className="rounded-[14px] object-cover"
                      />
                    ) : (
                      <CompanyAvatar
                        logoUrl={null}
                        companyName={orgOrganization.name}
                        size={112}
                      />
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className={labelClass}>Organization name</label>
                  <input
                    type="text"
                    value={orgOrganization.name}
                    readOnly
                    className={readOnlyInputClass}
                    style={{ color: '#9A9DA2' }}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={orgOrganization.description ?? ''}
                    readOnly
                    rows={4}
                    className={readOnlyInputClass + ' resize-none'}
                    style={{ color: '#9A9DA2' }}
                  />
                </div>
              </div>

              <OrgDeferredMessage>
                {canEditOrgProfile ? (
                  <>
                    Your company information is managed under {orgOrganization.name} — edit it from{' '}
                    <CompanySettingsLink href="/dashboard/organization?tab=profile">
                      Company Settings
                    </CompanySettingsLink>
                    .
                  </>
                ) : (
                  <>Your company information is managed by your organization.</>
                )}
              </OrgDeferredMessage>
            </>
          ) : (
            <>
              {/* Logo upload */}
              <div className="flex items-center gap-5 mb-6">
                <div className="relative shrink-0">
                  {logoUploading ? (
                    <div
                      className="w-[112px] h-[112px] bg-[#F7F8F9] border border-[#E8E9EA] flex items-center justify-center"
                      style={{ borderRadius: '14px' }}
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
                      size={112}
                    />
                  )}
                </div>

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
                    placeholder="Houston"
                    className={inputClass}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className={labelClass}>State / Province</label>
                  <input
                    type="text"
                    value={stateField}
                    onChange={e => setStateField(e.target.value)}
                    placeholder="Texas"
                    className={inputClass}
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="United States"
                  className={inputClass}
                  autoComplete="country-name"
                />
              </div>
            </>
          )}
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
            <PasswordInput
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
          </div>

          <div className="mb-4">
            <PasswordStrengthField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <PasswordInput
              id="confirm-new-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          {passwordError && <ErrorBanner message={passwordError} />}

          <SaveButton
            loading={savingPassword}
            disabled={!canUpdatePassword}
            label="Update Password"
          />
        </section>
      </form>

      <div className="border-t border-[#E8E9EA] my-8" />

      {/* ── Section 4: Membership ── */}
      <section className="mb-8">
        <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
          Membership
        </p>

        {isOrgMember && orgOrganization ? (
          <>
            <div
              className={'p-4 rounded-[14px] border ' + orgDeferredClass}
              style={{ borderColor: '#E8E9EA', background: '#FAFAFA' }}
            >
              <div className="flex items-center gap-3">
                <EnterpriseBadge />
                <div>
                  <p className="text-sm font-semibold text-ink">Enterprise Plan</p>
                  <p className="text-xs text-ink-3 font-sans">Unlimited active listings</p>
                </div>
              </div>

              {orgBillingDisplay?.billingInterval && (
                <div className="mt-3 pt-3 border-t border-[#E8E9EA] flex items-center gap-2">
                  <span className="text-xs text-ink-3 font-sans">Billing interval:</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold rounded-pill border"
                    style={{ background: '#F4F4F5', color: '#52525B', borderColor: '#E4E4E7' }}
                  >
                    {orgBillingDisplay.billingInterval === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
              )}
            </div>

            <OrgDeferredMessage>
              {canAccessOrgBilling ? (
                <>
                  Billing for your account is managed under {orgOrganization.name} — view it from{' '}
                  <CompanySettingsLink href="/dashboard/organization?tab=billing">
                    Company Settings
                  </CompanySettingsLink>
                  .
                </>
              ) : (
                <>Billing for your account is managed by your organization.</>
              )}
            </OrgDeferredMessage>
          </>
        ) : (
          <div
            className="p-4 rounded-[14px] border"
            style={{ borderColor: '#E8E9EA', background: '#FAFAFA' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PlanBadge plan={plan} />

                <div>
                  <p className="text-sm font-semibold text-ink">
                    {plan === 'premium' ? 'Premium (Legacy)' : plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                  </p>
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

              {plan === 'free' ? (
                <button
                  onClick={() => router.push('/dashboard/upgrade')}
                  className="px-4 py-2 text-sm font-bold text-white rounded-pill transition-colors"
                  style={{ background: '#FF6B35', boxShadow: '0 4px 14px rgba(255,107,53,0.28)' }}
                >
                  Upgrade Plan
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? (
                    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : null}
                  Manage Billing
                </button>
              )}
            </div>

            {plan !== 'free' && billingPeriod && (
              <div className="mt-3 pt-3 border-t border-[#E8E9EA] flex items-center gap-2">
                <span className="text-xs text-ink-3 font-sans">Billing period:</span>
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold rounded-pill border"
                  style={{ background: '#F4F4F5', color: '#52525B', borderColor: '#E4E4E7' }}
                >
                  {billingPeriod === 'annual' ? 'Annual' : 'Monthly'}
                </span>
              </div>
            )}

            {portalError && (
              <p className="mt-3 text-xs font-sans text-red-600">{portalError}</p>
            )}
          </div>
        )}
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
    </DashboardSettingsShell>
  )
}
