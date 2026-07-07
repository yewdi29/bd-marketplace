'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  listingId: string
  sellerId: string
}

const inputCls =
  'w-full px-3.5 py-2.5 text-sm font-sans text-ink bg-white border border-[#E8E9EA] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors placeholder:text-ink-3'

export default function InquiryForm({ listingId, sellerId }: Props) {
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    buyer_company: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('users')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile) return
          setForm(f => ({
            ...f,
            buyer_name: profile.full_name ?? f.buyer_name,
            buyer_email: profile.email ?? f.buyer_email,
            buyer_phone: profile.phone ?? f.buyer_phone,
          }))
        })
    })
  }, [])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, seller_id: sellerId, ...form }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Sent state ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="w-9 h-9 rounded-full bg-[#F0FFF0] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-[#1A5C18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-sans font-bold text-sm text-ink leading-none mb-1">Inquiry sent!</p>
          <p className="text-xs text-ink-3">The seller will reach out to you directly.</p>
        </div>
      </div>
    )
  }

  // ── Form — always visible ────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={form.buyer_name}
        onChange={set('buyer_name')}
        placeholder="Your name"
        required
        className={inputCls}
      />
      <input
        type="email"
        value={form.buyer_email}
        onChange={set('buyer_email')}
        placeholder="Email address"
        required
        className={inputCls}
      />
      <input
        type="tel"
        value={form.buyer_phone}
        onChange={set('buyer_phone')}
        placeholder="Phone (optional)"
        className={inputCls}
      />
      <input
        type="text"
        value={form.buyer_company}
        onChange={set('buyer_company')}
        placeholder="Company (optional)"
        className={inputCls}
      />
      <textarea
        value={form.message}
        onChange={set('message')}
        placeholder="I'm interested in this equipment. Can you provide more details?"
        required
        rows={4}
        className={`${inputCls} resize-none leading-relaxed`}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-50"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.28)' }}
      >
        {loading ? 'Sending…' : 'Send Inquiry'}
      </button>

      <p className="text-center font-sans text-ink-3" style={{ fontSize: '11px' }}>
        Your info is only shared with the seller
      </p>
    </form>
  )
}
