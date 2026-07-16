'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { DashboardSettingsShell } from '@/components/dashboard/DashboardSettingsShell'
import { DashboardUnderlineTabs } from '@/components/dashboard/DashboardUnderlineTabs'
import LocationMultiSelect, { LocationFieldHelper } from '@/components/organizations/LocationMultiSelect'
import ManagerPermissionsCheckboxes from '@/components/organizations/ManagerPermissionsCheckboxes'
import {
  DEFAULT_MANAGER_PERMISSIONS,
  managerHasBillingAccess,
  managerHasOrgWideManagerAccess,
  managerHasProfileEditAccess,
  type ManagerPermissions,
} from '@/lib/organizations/managerPermissions'
import {
  buildLocationAccessPreview,
  collectDistinctLocations,
  formatLocationsLabel,
  locationsOverlap,
  normalizeTeamLocations,
} from '@/lib/organizations/teamLocations'

interface Membership {
  id: string
  organization_id: string
  role: 'owner' | 'manager'
  team_tag: string[] | null
  is_primary_owner: boolean
  can_see_all_locations: boolean
  can_access_billing: boolean
  can_edit_company_info: boolean
  can_manage_managers_org_wide: boolean
}

interface Organization {
  id: string
  name: string
  logo_url: string | null
  description: string | null
  base_seat_count: number
  preferred_payment_method: string | null
}

interface MemberRow {
  id: string
  role: 'owner' | 'manager'
  team_tag: string[] | null
  is_primary_owner: boolean
  status: 'invited' | 'active' | 'expired'
  invited_email: string | null
  invite_expires_at: string | null
  full_name: string | null
  email: string | null
  can_see_all_locations: boolean
  can_access_billing: boolean
  can_edit_company_info: boolean
  can_manage_managers_org_wide: boolean
}

interface BillingInfo {
  planName: string
  billingInterval: 'monthly' | 'annual' | null
  baseSeatCount: number
  activeMemberCount: number
  invitedMemberCount: number
  seatsInUse: number
  additionalSeatsBilled: number
  preferredPaymentMethod: string | null
  hasPaymentMethod: boolean
  hasSubscription: boolean
}

function memberStatusLabel(status: MemberRow['status'], expiresAt: string | null): string {
  if (status === 'active') return 'Active'
  if (status === 'expired') return 'Expired'
  if (expiresAt && new Date(expiresAt) < new Date()) return 'Expired'
  return 'Invited'
}

const inputClass =
  'w-full bg-white border border-[#D4D5D7] rounded-[10px] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 font-sans focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors'
const labelClass = 'block text-sm font-medium text-ink mb-1.5'
const sectionHeadingClass =
  'text-[11px] font-sans font-semibold uppercase tracking-wider mb-5'

function InviteModal({
  open,
  onClose,
  organizationId,
  isOwner,
  lockedLocations,
  existingLocations,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  organizationId: string
  isOwner: boolean
  lockedLocations: string[] | null
  existingLocations: string[]
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'manager'>('manager')
  const [locations, setLocations] = useState<string[]>([])
  const [permissions, setPermissions] = useState<ManagerPermissions>({ ...DEFAULT_MANAGER_PERMISSIONS })
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [previewAmount, setPreviewAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationsLocked = !isOwner && lockedLocations != null

  useEffect(() => {
    if (open) {
      setEmail('')
      setRole('manager')
      setPermissions({ ...DEFAULT_MANAGER_PERMISSIONS })
      setLocations(
        locationsLocked
          ? normalizeTeamLocations(lockedLocations)
          : existingLocations.length > 0
            ? [existingLocations[0]]
            : [],
      )
      setStep('form')
      setPreviewAmount(null)
      setError(null)
    }
  }, [open, lockedLocations, existingLocations, locationsLocked])

  const resolvedLocations = locationsLocked
    ? normalizeTeamLocations(lockedLocations)
    : normalizeTeamLocations(locations)

  const showLocationField = (isOwner ? role === 'manager' : true) && !permissions.can_see_all_locations
  const previewLine = buildLocationAccessPreview(
    email,
    resolvedLocations,
    permissions.can_see_all_locations,
  )

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (showLocationField && resolvedLocations.length === 0) {
      setError('Assign at least one location')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'preview',
          email,
          role: isOwner ? role : 'manager',
          team_tag: showLocationField ? resolvedLocations : null,
          permissions: isOwner && role === 'manager' ? permissions : undefined,
        }),
      })
      const data = await res.json() as { preview?: { proratedAmount: number; requiresBillingChange: boolean }; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Preview failed')
      setPreviewAmount(data.preview?.requiresBillingChange ? data.preview.proratedAmount : 0)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'confirm',
          email,
          role: isOwner ? role : 'manager',
          team_tag: showLocationField ? resolvedLocations : null,
          permissions: isOwner && role === 'manager' ? permissions : undefined,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Invite failed')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-ink mb-4">
          {step === 'form' ? 'Invite team member' : 'Confirm seat billing'}
        </h3>

        {step === 'form' ? (
          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {isOwner && (
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={role}
                  onChange={e => {
                    const nextRole = e.target.value as 'owner' | 'manager'
                    setRole(nextRole)
                    if (nextRole === 'owner') {
                      setPermissions({ ...DEFAULT_MANAGER_PERMISSIONS })
                    }
                  }}
                  className={inputClass}
                >
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            )}

            {isOwner && role === 'manager' && (
              <ManagerPermissionsCheckboxes
                value={permissions}
                onChange={next => {
                  setPermissions(next)
                  if (next.can_see_all_locations) setLocations([])
                }}
                collapsible
              />
            )}

            {showLocationField && (
              <div>
                <label className={labelClass}>Assign to Location(s)</label>
                <LocationMultiSelect
                  value={resolvedLocations}
                  onChange={setLocations}
                  options={existingLocations}
                  disabled={locationsLocked}
                />
                <LocationFieldHelper />
                <p className="text-xs text-ink-2 mt-2 font-sans">{previewLine}</p>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-2">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-orange rounded-pill">
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              Inviting this person will add{' '}
              <strong>${(previewAmount ?? 0).toFixed(2)}</strong> to your next invoice (prorated for the current billing period).
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setStep('form')} className="px-4 py-2 text-sm text-ink-2">Back</button>
              <button type="button" onClick={handleConfirm} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-orange rounded-pill">
                {loading ? 'Sending…' : 'Confirm & send invite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EditLocationsModal({
  open,
  onClose,
  organizationId,
  member,
  isOwner,
  managerLocations,
  existingLocations,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  organizationId: string
  member: MemberRow
  isOwner: boolean
  managerLocations: string[]
  existingLocations: string[]
  onSuccess: () => void
}) {
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteeLabel = member.full_name ?? member.email ?? 'This person'

  useEffect(() => {
    if (open) {
      setLocations(normalizeTeamLocations(member.team_tag))
      setError(null)
    }
  }, [open, member.team_tag])

  const previewLine = buildLocationAccessPreview(inviteeLabel, locations, member.can_see_all_locations)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!member.can_see_all_locations && locations.length === 0) {
      setError('Assign at least one location')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_tag: locations }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const optionPool = isOwner
    ? Array.from(new Set([...existingLocations, ...locations])).sort((a, b) => a.localeCompare(b))
    : Array.from(new Set([...managerLocations, ...locations])).sort((a, b) => a.localeCompare(b))

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-ink mb-1">Edit locations</h3>
        <p className="text-sm text-ink-3 mb-4">{inviteeLabel}</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Assign to Location(s)</label>
            <LocationMultiSelect
              value={locations}
              onChange={setLocations}
              options={optionPool.filter(opt => !locations.includes(opt))}
              allowCreate={isOwner}
            />
            <LocationFieldHelper />
            <p className="text-xs text-ink-2 mt-2 font-sans">{previewLine}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-2">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-orange rounded-pill">
              {loading ? 'Saving…' : 'Save locations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditPermissionsModal({
  open,
  onClose,
  organizationId,
  member,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  organizationId: string
  member: MemberRow
  onSuccess: () => void
}) {
  const [permissions, setPermissions] = useState<ManagerPermissions>({ ...DEFAULT_MANAGER_PERMISSIONS })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteeLabel = member.full_name ?? member.email ?? 'This person'

  useEffect(() => {
    if (open) {
      setPermissions({
        can_see_all_locations: member.can_see_all_locations,
        can_access_billing: member.can_access_billing,
        can_edit_company_info: member.can_edit_company_info,
        can_manage_managers_org_wide: member.can_manage_managers_org_wide,
      })
      setError(null)
    }
  }, [open, member])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-ink mb-1">Edit permissions</h3>
        <p className="text-sm text-ink-3 mb-4">{inviteeLabel}</p>

        <form onSubmit={handleSave} className="space-y-4">
          <ManagerPermissionsCheckboxes value={permissions} onChange={setPermissions} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-2">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-orange rounded-pill">
              {loading ? 'Saving…' : 'Save permissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function memberLocationLabel(member: MemberRow): string {
  if (member.role === 'owner') return '—'
  if (member.can_see_all_locations) return 'All locations'
  return formatLocationsLabel(member.team_tag)
}

export default function OrganizationPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileDescription, setProfileDescription] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [transferMemberId, setTransferMemberId] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferAcceptToken, setTransferAcceptToken] = useState<string | null>(null)
  const [editLocationsMember, setEditLocationsMember] = useState<MemberRow | null>(null)
  const [editPermissionsMember, setEditPermissionsMember] = useState<MemberRow | null>(null)

  const isOwner = membership?.role === 'owner'
  const canAccessBilling = membership ? managerHasBillingAccess(membership) : false
  const canEditProfile = membership ? managerHasProfileEditAccess(membership) : false
  const hasOrgWideManager = membership ? managerHasOrgWideManagerAccess(membership) : false
  const billingPending = Boolean(organization && !organization.preferred_payment_method)
  const activeTab = billingPending
    ? 'billing'
    : (searchParams.get('tab') ?? (isOwner || canEditProfile ? 'profile' : 'team'))
  const paymentSetupCancelled = searchParams.get('payment_setup') === 'cancelled'
  const paymentSetupSuccess = searchParams.get('payment_setup') === 'success'
  const managerLocations = normalizeTeamLocations(membership?.team_tag)

  const existingLocations = useMemo(
    () => collectDistinctLocations(members),
    [members],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const meRes = await fetch('/api/organizations/me')
      const meData = await meRes.json() as {
        membership?: Membership
        organization?: Organization
        error?: string
      }
      if (!meRes.ok || !meData.membership || !meData.organization) {
        throw new Error(meData.error ?? 'Organization access required')
      }
      setMembership(meData.membership)
      setOrganization(meData.organization)
      setProfileName(meData.organization.name)
      setProfileDescription(meData.organization.description ?? '')

      const membersRes = await fetch(`/api/organizations/${meData.organization.id}/members`)
      const membersData = await membersRes.json() as { members?: MemberRow[]; error?: string }
      if (!membersRes.ok) throw new Error(membersData.error ?? 'Failed to load team')
      setMembers(membersData.members ?? [])

      if (managerHasBillingAccess(meData.membership)) {
        const billingRes = await fetch(`/api/organizations/${meData.organization.id}/billing`)
        const billingData = await billingRes.json() as { billing?: BillingInfo; error?: string }
        if (billingRes.ok) setBilling(billingData.billing ?? null)
      } else {
        setBilling(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!billingPending || !membership) return
    if (searchParams.get('tab') === 'billing') return
    const params = new URLSearchParams({ tab: 'billing' })
    if (membership.is_primary_owner) params.set('setup', 'billing')
    router.replace(`/dashboard/organization?${params.toString()}`)
  }, [billingPending, membership, router, searchParams])

  useEffect(() => {
    if (!paymentSetupSuccess) return
    void load().then(() => {
      router.replace('/dashboard/organization?tab=billing')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSetupSuccess])

  useEffect(() => {
    const token = searchParams.get('transfer')
    if (token) setTransferAcceptToken(token)
  }, [searchParams])

  const paymentSetupTriggered = useRef(false)
  useEffect(() => {
    if (paymentSetupTriggered.current) return
    if (searchParams.get('setup') !== 'billing') return
    if (!organization || organization.preferred_payment_method) return
    if (!membership?.is_primary_owner) return
    paymentSetupTriggered.current = true
    void handlePaymentSetup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, organization, billing, membership])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!organization) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, description: profileDescription }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!organization || !e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    const res = await fetch(`/api/organizations/${organization.id}/logo`, { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Logo upload failed')
      return
    }
    await load()
  }

  async function handlePaymentSetup() {
    if (!organization) return
    const res = await fetch(`/api/organizations/${organization.id}/payment-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/dashboard/organization?tab=billing` }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Failed to start payment setup')
      return
    }
    window.location.href = data.url
  }

  async function handleBillingPortal() {
    if (!organization) return
    const res = await fetch(`/api/organizations/${organization.id}/billing-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/dashboard/organization?tab=billing` }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Failed to open billing portal')
      return
    }
    window.location.href = data.url
  }

  async function removeMember(memberId: string) {
    if (!organization || !confirm('Remove this member from the organization?')) return
    const res = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, { method: 'DELETE' })
    const data = await res.json() as { error?: string }
    if (!res.ok) {
      setError(data.error ?? 'Remove failed')
      return
    }
    await load()
  }

  async function initiateTransfer() {
    if (!organization || !transferMemberId) return
    setTransferLoading(true)
    try {
      const res = await fetch(`/api/organizations/${organization.id}/ownership-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toMemberId: transferMemberId }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Transfer request failed')
      alert('Transfer request sent. The recipient must accept via email.')
      setTransferMemberId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setTransferLoading(false)
    }
  }

  async function acceptTransfer() {
    if (!transferAcceptToken) return
    setTransferLoading(true)
    try {
      const res = await fetch('/api/organizations/ownership-transfer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: transferAcceptToken }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Accept failed')
      setTransferAcceptToken(null)
      router.replace('/dashboard/organization?tab=billing')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed')
    } finally {
      setTransferLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardSettingsShell>
        <div className="h-7 w-56 bg-[#F0F0F0] rounded-[10px] animate-pulse mb-8" />
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-[#F0F0F0] rounded-[10px] animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 bg-[#F0F0F0] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </DashboardSettingsShell>
    )
  }

  if (error && !organization) {
    return (
      <DashboardSettingsShell>
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      </DashboardSettingsShell>
    )
  }

  if (!organization || !membership) return null

  const currentMembership = membership

  const transferCandidates = members.filter(m => m.status === 'active' && m.role !== 'owner' || (m.role === 'owner' && !m.is_primary_owner))
  const roleSubtitle = [
    currentMembership.role === 'owner' ? 'Owner' : 'Manager',
    currentMembership.role === 'manager' && currentMembership.can_see_all_locations
      ? 'All locations'
      : currentMembership.team_tag?.length
        ? formatLocationsLabel(currentMembership.team_tag)
        : null,
    currentMembership.is_primary_owner ? 'Primary owner' : null,
  ].filter(Boolean).join(' · ')

  function canEditMemberLocations(member: MemberRow): boolean {
    if (member.role !== 'manager' || member.is_primary_owner || member.can_see_all_locations) return false
    if (member.status === 'expired') return false
    if (isOwner) return true
    if (hasOrgWideManager) return true
    return locationsOverlap(member.team_tag, currentMembership.team_tag)
  }

  function canRemoveMember(member: MemberRow): boolean {
    if (member.is_primary_owner || member.status === 'expired') return false
    if (isOwner) return true
    if (member.role !== 'manager') return false
    if (hasOrgWideManager) return true
    return locationsOverlap(member.team_tag, currentMembership.team_tag)
  }

  const tabs = billingPending
    ? [{ value: 'billing', label: 'Billing' }]
    : [
        ...(canEditProfile ? [{ value: 'profile', label: 'Company Profile' }] : []),
        { value: 'team', label: 'Team' },
        ...(canAccessBilling ? [{ value: 'billing', label: 'Billing' }] : []),
      ]

  function handleTabChange(tab: string) {
    if (billingPending) return
    router.replace(`/dashboard/organization?tab=${tab}`)
  }

  return (
    <DashboardSettingsShell>
      <h1 className="font-sans font-bold text-ink mb-2" style={{ fontSize: '20px' }}>
        Company Settings
      </h1>
      <p className="text-sm text-ink-3 mb-8">
        {organization.name}
        {roleSubtitle ? ` · ${roleSubtitle}` : ''}
      </p>

      {error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 mb-5 text-sm text-red-600">{error}</div>
      )}

      {billingPending && (
        <div
          className="rounded-[14px] border px-4 py-4 mb-6"
          style={{ borderColor: '#FFD4C2', background: '#FFF2ED' }}
        >
          <p className="text-sm font-semibold text-ink mb-1">Billing setup required</p>
          {paymentSetupCancelled && membership.is_primary_owner && canAccessBilling && (
            <p className="text-sm text-ink-2 mb-2">
              Billing setup was cancelled. Add a payment method to unlock your dashboard.
            </p>
          )}
          {canAccessBilling ? (
            <p className="text-sm text-ink-2">
              {membership.is_primary_owner
                ? 'Complete billing setup below to access your dashboard and Enterprise features.'
                : 'Complete billing setup below to unlock dashboard access for your organization.'}
            </p>
          ) : (
            <p className="text-sm text-ink-2">
              Your organization&apos;s billing setup is incomplete. Contact your primary Owner to
              finish setup before you can access the dashboard.
            </p>
          )}
        </div>
      )}

      {transferAcceptToken && !billingPending && (
        <div className="mb-8 rounded-[14px] border border-[#E8E9EA] bg-[#FAFAFA] p-4">
          <p className="text-sm text-ink mb-4">You have a pending primary ownership transfer request.</p>
          <button
            type="button"
            onClick={acceptTransfer}
            disabled={transferLoading}
            className="px-4 py-2.5 text-sm font-bold text-white bg-orange rounded-pill"
            style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
          >
            {transferLoading ? 'Accepting…' : 'Accept primary ownership'}
          </button>
        </div>
      )}

      <DashboardUnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel="Organization sections"
      />

      {canEditProfile && activeTab === 'profile' && !billingPending && (
        <section>
          <form onSubmit={saveProfile}>
            <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
              Company Profile
            </p>

            <div className="flex items-center gap-5 mb-8">
              <div className="relative shrink-0">
                {organization.logo_url ? (
                  <Image
                    src={organization.logo_url}
                    alt=""
                    width={72}
                    height={72}
                    className="rounded-[12px] object-cover"
                  />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-[12px] bg-[#F7F8F9] border border-[#E8E9EA]" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Logo
                  <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-xs text-ink-3 font-sans">PNG or JPG · Max 5 MB</p>
              </div>
            </div>

            <div className="mb-4">
              <label className={labelClass}>Organization name</label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="mb-8">
              <label className={labelClass}>Description</label>
              <textarea
                value={profileDescription}
                onChange={e => setProfileDescription(e.target.value)}
                rows={4}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-pill transition-colors disabled:cursor-not-allowed"
              style={{
                background: savingProfile ? '#E8E9EA' : '#FF6B35',
                color: savingProfile ? '#9A9DA2' : '#FFFFFF',
                boxShadow: savingProfile ? 'none' : '0 4px 16px rgba(255,107,53,0.25)',
              }}
            >
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'team' && !billingPending && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <p className={sectionHeadingClass} style={{ color: '#9A9DA2', marginBottom: 0 }}>
              Team roster
            </p>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="px-4 py-2.5 text-sm font-bold text-white bg-orange rounded-pill"
              style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
            >
              + Invite
            </button>
          </div>

          <div className="overflow-x-auto rounded-[14px] border border-[#E8E9EA] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E9EA] text-left text-ink-3">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-[#F0F0F0] last:border-0">
                    <td className="px-4 py-3">{member.full_name ?? member.email ?? '—'}</td>
                    <td className="px-4 py-3 capitalize">{member.role}{member.is_primary_owner ? ' · Primary' : ''}</td>
                    <td className="px-4 py-3">{memberLocationLabel(member)}</td>
                    <td className="px-4 py-3">{memberStatusLabel(member.status, member.invite_expires_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isOwner && member.role === 'manager' && member.status !== 'expired' && (
                          <button
                            type="button"
                            onClick={() => setEditPermissionsMember(member)}
                            className="text-xs text-ink-2 hover:text-ink hover:underline"
                          >
                            Edit permissions
                          </button>
                        )}
                        {canEditMemberLocations(member) && (
                          <button
                            type="button"
                            onClick={() => setEditLocationsMember(member)}
                            className="text-xs text-ink-2 hover:text-ink hover:underline"
                          >
                            Edit locations
                          </button>
                        )}
                        {canRemoveMember(member) && (
                          <button
                            type="button"
                            onClick={() => void removeMember(member.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(canAccessBilling || billingPending) && activeTab === 'billing' && (
        <section>
          <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
            Billing
          </p>

          <div
            className="p-4 rounded-[14px] border mb-8"
            style={{ borderColor: '#E8E9EA', background: '#FAFAFA' }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ink-3 font-sans mb-1">Plan</p>
                <p className="text-sm font-semibold text-ink">{billing?.planName ?? 'Enterprise'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-3 font-sans mb-1">Billing interval</p>
                <p className="text-sm text-ink capitalize">{billing?.billingInterval ?? '—'} (read-only)</p>
              </div>
              <div>
                <p className="text-xs text-ink-3 font-sans mb-1">Seat usage</p>
                <p className="text-sm text-ink">
                  {billing?.seatsInUse ?? 0} of {billing?.baseSeatCount ?? organization.base_seat_count} included seats
                  {' — '}
                  {billing?.additionalSeatsBilled ?? 0} additional seats billed
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E9EA]">
              {canAccessBilling && !billing?.hasPaymentMethod && !organization.preferred_payment_method ? (
                <button
                  type="button"
                  onClick={handlePaymentSetup}
                  className="w-full px-4 py-2.5 text-sm font-bold text-white bg-orange rounded-pill"
                  style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
                >
                  Set up billing
                </button>
              ) : canAccessBilling && (billing?.hasPaymentMethod || organization.preferred_payment_method) ? (
                <button
                  type="button"
                  onClick={handleBillingPortal}
                  className="px-4 py-2 text-sm font-semibold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] hover:text-ink transition-colors"
                >
                  Manage billing
                </button>
              ) : null}
            </div>
          </div>

          {isOwner && membership.is_primary_owner && !billingPending && (
            <div className="pt-2">
              <p className={sectionHeadingClass} style={{ color: '#9A9DA2' }}>
                Transfer primary ownership
              </p>
              <p className="text-sm text-ink-3 mb-4">
                The recipient must accept before primary ownership changes. You will remain an Owner in the organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={transferMemberId}
                  onChange={e => setTransferMemberId(e.target.value)}
                  className={inputClass + ' sm:flex-1'}
                >
                  <option value="">Select recipient…</option>
                  {transferCandidates.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name ?? m.email} ({m.role})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={initiateTransfer}
                  disabled={!transferMemberId || transferLoading}
                  className="px-4 py-2.5 text-sm font-semibold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  Request transfer
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organizationId={organization.id}
        isOwner={isOwner}
        lockedLocations={
          membership.role === 'manager' && !hasOrgWideManager ? managerLocations : null
        }
        existingLocations={existingLocations}
        onSuccess={load}
      />

      {editLocationsMember && (
        <EditLocationsModal
          open={Boolean(editLocationsMember)}
          onClose={() => setEditLocationsMember(null)}
          organizationId={organization.id}
          member={editLocationsMember}
          isOwner={isOwner}
          managerLocations={managerLocations}
          existingLocations={existingLocations}
          onSuccess={load}
        />
      )}

      {editPermissionsMember && (
        <EditPermissionsModal
          open={Boolean(editPermissionsMember)}
          onClose={() => setEditPermissionsMember(null)}
          organizationId={organization.id}
          member={editPermissionsMember}
          onSuccess={load}
        />
      )}
    </DashboardSettingsShell>
  )
}
