'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  sellerId: string
  sellerName: string
}

const inputCls =
  'w-full px-3.5 py-2.5 text-sm font-sans text-ink bg-white border border-[#E8E9EA] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors placeholder:text-ink-3'

export default function SellerContactModal({ sellerId, sellerName }: Props) {
  const [open, setOpen] = useState(false)
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
  const backdropRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleClose() {
    if (loading) return
    setOpen(false)
    // Reset after close animation
    setTimeout(() => {
      setSent(false)
      setError('')
      setForm({ buyer_name: '', buyer_email: '', buyer_phone: '', buyer_company: '', message: '' })
    }, 200)
  }

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
        body: JSON.stringify({ seller_id: sellerId, ...form }),
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

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shrink-0"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.28)' }}
      >
        Send Message
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === backdropRef.current) handleClose() }}
        >
          <div
            className="relative w-full bg-white rounded-[20px] overflow-hidden"
            style={{ maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F1F2]">
              <div>
                <p className="font-sans font-bold text-ink" style={{ fontSize: '16px', letterSpacing: '-0.01em' }}>
                  Send a Message
                </p>
                <p className="font-sans text-ink-3 mt-0.5" style={{ fontSize: '12px' }}>
                  to {sellerName}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-[#F0F1F2] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {sent ? (
                /* Success state */
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F0FFF0] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#1A5C18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-bold text-ink mb-1" style={{ fontSize: '15px' }}>Message sent!</p>
                    <p className="font-sans text-ink-3" style={{ fontSize: '13px' }}>
                      {sellerName} will reach out to you directly.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Form */
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
                    placeholder={`Hi, I'm interested in connecting with ${sellerName}...`}
                    required
                    rows={4}
                    className={`${inputCls} resize-none leading-relaxed`}
                  />

                  {error && <p className="text-xs text-red-500 font-sans">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-50"
                    style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.28)' }}
                  >
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>

                  <p className="text-center font-sans text-ink-3" style={{ fontSize: '11px' }}>
                    Your info is only shared with the seller
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
