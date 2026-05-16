'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'drilling_rig', label: 'Drilling Rig' },
  { value: 'drill_pipe', label: 'Drill Pipe' },
  { value: 'drill_collar', label: 'Drill Collar' },
  { value: 'blowout_preventer', label: 'Blowout Preventer (BOP)' },
  { value: 'wellhead', label: 'Wellhead Equipment' },
  { value: 'pumping_unit', label: 'Pumping Unit' },
  { value: 'artificial_lift', label: 'Artificial Lift' },
  { value: 'wireline', label: 'Wireline Equipment' },
  { value: 'coiled_tubing', label: 'Coiled Tubing' },
  { value: 'completion_equipment', label: 'Completion Equipment' },
  { value: 'production_equipment', label: 'Production Equipment' },
  { value: 'compressor', label: 'Compressor' },
  { value: 'separator', label: 'Separator' },
  { value: 'tank', label: 'Tank' },
  { value: 'flowline', label: 'Flowline & Piping' },
  { value: 'electrical', label: 'Electrical Equipment' },
  { value: 'safety', label: 'Safety Equipment' },
  { value: 'rental_tools', label: 'Rental Tools' },
  { value: 'other', label: 'Other' },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'parts_only', label: 'Parts Only' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditForm {
  title: string
  category: string
  manufacturer: string
  model: string
  year: string
  condition: string
  price: string
  price_visible: boolean
  location_city: string
  location_state: string
  description: string
}

interface Props {
  listingId: string
  onClose: () => void
  onSaved: () => void
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors placeholder:text-ink-3'

const selectCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors appearance-none cursor-pointer'

const labelCls = 'block text-sm font-semibold text-ink mb-1.5'

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditListingModal({ listingId, onClose, onSaved }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState<EditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch current listing data on mount (read via anon client — no mutations)
  useEffect(() => {
    async function fetchListing() {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('title, category, manufacturer, model, year, condition, price, price_visible, location_city, location_state, description')
        .eq('id', listingId)
        .single()

      if (fetchError || !data) {
        setError('Could not load listing data.')
        setLoading(false)
        return
      }

      setForm({
        title: data.title ?? '',
        category: data.category ?? '',
        manufacturer: data.manufacturer ?? '',
        model: data.model ?? '',
        year: data.year != null ? String(data.year) : '',
        condition: data.condition ?? '',
        price: data.price != null && data.price > 0 ? String(data.price) : '',
        price_visible: data.price_visible !== false,
        location_city: data.location_city ?? '',
        location_state: data.location_state ?? '',
        description: data.description ?? '',
      })
      setLoading(false)
    }
    fetchListing()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          manufacturer: form.manufacturer || null,
          model: form.model || null,
          year: form.year ? parseInt(form.year) : null,
          condition: form.condition,
          price: parseFloat(form.price) || 0,
          price_visible: form.price_visible,
          location_city: form.location_city || null,
          location_state: form.location_state || null,
          description: form.description || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Save failed. Please try again.')
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full bg-white flex flex-col"
        style={{ maxWidth: '680px', borderRadius: '20px', maxHeight: '90vh', boxShadow: '0 32px 80px rgba(0,0,0,0.20)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-8 pt-6 pb-4 border-b border-[#E8E9EA] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-ink-3 uppercase tracking-wide mb-0.5">Edit Listing</p>
            <h2 className="font-sans font-bold text-lg text-ink" style={{ letterSpacing: '-0.02em' }}>
              Update details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink-3 hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-6 h-6 animate-spin text-ink-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : !form ? (
            <p className="text-sm text-red-500">{error || 'Failed to load listing.'}</p>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              {/* Title */}
              <FormField label="Title">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                  className={inputCls}
                  placeholder="Equipment title"
                />
              </FormField>

              {/* Category + Condition */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category">
                  <SelectWrapper>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => f ? { ...f, category: e.target.value } : f)}
                      className={selectCls}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
                <FormField label="Condition">
                  <SelectWrapper>
                    <select
                      value={form.condition}
                      onChange={e => setForm(f => f ? { ...f, condition: e.target.value } : f)}
                      className={selectCls}
                    >
                      <option value="">Select condition</option>
                      {CONDITIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
              </div>

              {/* Manufacturer + Model */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={e => setForm(f => f ? { ...f, manufacturer: e.target.value } : f)}
                    className={inputCls}
                    placeholder="e.g. National, Cameron"
                  />
                </FormField>
                <FormField label="Model">
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => setForm(f => f ? { ...f, model: e.target.value } : f)}
                    className={inputCls}
                    placeholder="e.g. 12P-160"
                  />
                </FormField>
              </div>

              {/* Year */}
              <FormField label="Year">
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm(f => f ? { ...f, year: e.target.value } : f)}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 2018"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </FormField>

              {/* Price */}
              <FormField label="Price (USD)">
                <div className="relative mb-2.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 text-sm font-sans pointer-events-none">$</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => f ? { ...f, price: e.target.value } : f)}
                    className={`${inputCls} pl-7 font-mono`}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setForm(f => f ? { ...f, price_visible: !f.price_visible } : f)}
                    className="relative inline-flex shrink-0 cursor-pointer"
                    style={{ width: '36px', height: '20px' }}
                  >
                    <div
                      className="w-full h-full rounded-pill transition-colors"
                      style={{ background: form.price_visible ? '#FF6B35' : '#D4D5D7' }}
                    />
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: form.price_visible ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </button>
                  <span className="text-sm text-ink-2">
                    {form.price_visible ? 'Price visible to buyers' : 'Show "Contact for price" instead'}
                  </span>
                </label>
              </FormField>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City">
                  <input
                    type="text"
                    value={form.location_city}
                    onChange={e => setForm(f => f ? { ...f, location_city: e.target.value } : f)}
                    className={inputCls}
                    placeholder="e.g. Midland"
                  />
                </FormField>
                <FormField label="State">
                  <SelectWrapper>
                    <select
                      value={form.location_state}
                      onChange={e => setForm(f => f ? { ...f, location_state: e.target.value } : f)}
                      className={selectCls}
                    >
                      <option value="">Select state</option>
                      {US_STATES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
              </div>

              {/* Description */}
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={{ minHeight: '120px' }}
                  placeholder="Detailed equipment description for buyers…"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && form && (
          <div className="shrink-0 border-t border-[#E8E9EA] px-8 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
              style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
