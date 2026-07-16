'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EnterpriseDiamondMark } from '@/components/ui/PlanBadge'

const EMPTY_FORM = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  estimated_team_size: '',
  locations_regions: '',
  message: '',
}

/** Matches reasonable US/international phone lengths (digits only). */
function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim()
  if (!trimmed) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

const TEAM_SIZE_OPTIONS = [
  { value: '1-5', label: '1–5 people' },
  { value: '6-10', label: '6–10 people' },
  { value: '11-25', label: '11–25 people' },
  { value: '26-50', label: '26–50 people' },
  { value: '51-100', label: '51–100 people' },
  { value: '100+', label: '100+ people' },
]

export const ENTERPRISE_FEATURES = [
  'Everything in Max, plus:',
  '5 seats included, additional seats available',
  'Multi-location / multi-branch team support',
  'Owner and Manager roles with organization-wide visibility',
  'Dedicated support',
] as const

export function EnterpriseIntakeModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadProfilePrefill() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setForm(EMPTY_FORM)
          setError('')
          setSuccess(false)
        }
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email, phone, company_name')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      setForm({
        company_name: profile?.company_name?.trim() ?? '',
        contact_name: profile?.full_name?.trim() ?? '',
        contact_email: (profile?.email ?? user.email ?? '').trim(),
        contact_phone: profile?.phone?.trim() ?? '',
        estimated_team_size: '',
        locations_regions: '',
        message: '',
      })
      setError('')
      setSuccess(false)
    }

    void loadProfilePrefill()
    return () => { cancelled = true }
  }, [open])

  function reset() {
    setForm(EMPTY_FORM)
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.contact_phone.trim()) {
      setError('Contact phone is required.')
      return
    }
    if (!isValidPhone(form.contact_phone)) {
      setError('Enter a valid phone number (at least 10 digits).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/enterprise/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={o => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-white p-6 outline-none"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-lg font-bold text-ink">
              Enterprise inquiry
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-ink-3 hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {success ? (
            <div>
              <p className="font-sans text-sm text-ink-2 mb-4">
                Thank you — our team will reach out shortly to discuss your Enterprise needs.
              </p>
              <Button variant="primary" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="font-sans text-sm text-ink-3 mb-2">
                Tell us about your team. This does not create an account or start billing.
              </p>
              {(['company_name', 'contact_name', 'contact_email'] as const).map(field => (
                <div key={field}>
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                    {field === 'company_name' ? 'Company name' : field === 'contact_name' ? 'Contact name' : 'Contact email'}
                    {' *'}
                  </label>
                  <input
                    required
                    type={field === 'contact_email' ? 'email' : 'text'}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full rounded-[10px] border border-[#E8E9EA] px-3 py-2.5 text-sm font-sans text-ink focus:border-[#D4D5D7] focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                  Contact phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full rounded-[10px] border border-[#E8E9EA] px-3 py-2.5 text-sm font-sans text-ink focus:border-[#D4D5D7] focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                  Estimated team size *
                </label>
                <select
                  required
                  value={form.estimated_team_size}
                  onChange={e => setForm(f => ({ ...f, estimated_team_size: e.target.value }))}
                  className="w-full rounded-[10px] border border-[#E8E9EA] px-3 py-2.5 text-sm font-sans text-ink focus:border-[#D4D5D7] focus:outline-none"
                >
                  <option value="">Select range</option>
                  {TEAM_SIZE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                  Locations / regions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Permian Basin, Gulf Coast, nationwide"
                  value={form.locations_regions}
                  onChange={e => setForm(f => ({ ...f, locations_regions: e.target.value }))}
                  className="w-full rounded-[10px] border border-[#E8E9EA] px-3 py-2.5 text-sm font-sans text-ink focus:border-[#D4D5D7] focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                  Message / notes
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-[10px] border border-[#E8E9EA] px-3 py-2.5 text-sm font-sans text-ink focus:border-[#D4D5D7] focus:outline-none resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit inquiry'}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Wide horizontal Enterprise row — renders beneath individual tier cards on pricing/upgrade pages. */
export default function EnterpriseTierBlock({ className = '' }: { className?: string }) {
  const [enterpriseOpen, setEnterpriseOpen] = useState(false)

  return (
    <>
      <div
        className={`bg-white rounded-[20px] flex flex-col lg:flex-row lg:items-stretch gap-8 ${className}`.trim()}
        style={{
          border: '1.5px solid #B3D1FF',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)',
          boxShadow: '0 4px 16px rgba(0,102,204,0.06)',
          padding: '28px 24px 24px',
        }}
      >
        <div className="flex-1 min-w-0">
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: '#004499' }}
          >
            Teams &amp; organizations
          </p>
          <div className="flex items-center gap-2 mb-4">
            <p
              className="font-sans font-bold text-ink"
              style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
            >
              Enterprise
            </p>
            <EnterpriseDiamondMark />
          </div>
          <p className="font-sans text-ink-2 text-sm mb-5 max-w-2xl" style={{ lineHeight: 1.6 }}>
            Multi-location sellers with role-based access, location scoping, centralized billing, and unlimited scale.
            Includes 5 seats — additional seats billed per user.
            Inquire about our Enterprise package and one of our representatives will get you set up.
          </p>
          <div className="border-t border-[#F0F1F2] mb-5" />
          <ul className="space-y-3">
            {ENTERPRISE_FEATURES.map(label => (
              <li key={label} className="flex items-start gap-2.5">
                <span className="shrink-0 font-bold text-sm" style={{ color: '#FF6B35' }}>✓</span>
                <span className="font-sans text-sm leading-snug" style={{ color: '#4A4D52' }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 flex items-end lg:items-center lg:justify-center lg:px-2">
          <button
            type="button"
            onClick={() => setEnterpriseOpen(true)}
            className="w-full lg:w-auto px-8 py-3 text-sm font-bold rounded-pill text-white transition-colors whitespace-nowrap"
            style={{ background: '#FF6B35' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF8855' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF6B35' }}
          >
            Request Enterprise
          </button>
        </div>
      </div>

      <EnterpriseIntakeModal open={enterpriseOpen} onOpenChange={setEnterpriseOpen} />
    </>
  )
}
