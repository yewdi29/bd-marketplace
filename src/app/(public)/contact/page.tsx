'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

const SUBJECTS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'listing', label: 'Listing Support' },
  { value: 'membership', label: 'Membership' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '900px', padding: '64px 32px' }}>
      {/* Header */}
      <div className="mb-12">
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
          GET IN TOUCH
        </p>
        <h1
          className="font-sans text-ink mb-4"
          style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          We&rsquo;d love to hear from you.
        </h1>
        <p className="font-sans text-ink-2" style={{ fontSize: '16px', lineHeight: 1.7, maxWidth: '560px' }}>
          Have a question about listing equipment, membership, or how Black Diamond works?
          Send us a message and we&rsquo;ll get back to you shortly.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left — contact info */}
        <div>
          <p
            className="font-sans text-ink mb-4"
            style={{ fontSize: '14px', fontWeight: 700 }}
          >
            Contact Information
          </p>

          <a
            href="mailto:contact@blackdiamondmarketplace.com"
            className="flex items-center gap-3 text-ink hover:text-orange transition-colors group"
          >
            {/* Envelope icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9A9DA2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 group-hover:stroke-orange transition-colors"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span className="font-mono text-sm">contact@blackdiamondmarketplace.com</span>
          </a>

          <p
            className="font-sans text-ink-3 mt-3"
            style={{ fontSize: '13px', lineHeight: 1.6 }}
          >
            We typically respond within 1 business day.
          </p>

          <div className="my-6 border-t border-[#E8E9EA]" />

          <p
            className="font-sans text-ink-3"
            style={{ fontSize: '13px', lineHeight: 1.7 }}
          >
            For listing support, account issues, membership questions, or general inquiries — we read every message.
          </p>
        </div>

        {/* Right — form card */}
        <div
          className="bg-white border border-[#E8E9EA] shadow-card"
          style={{ borderRadius: '16px', padding: '28px' }}
        >
          {success ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#F0FFF0',
                  border: '1px solid #C8F5C4',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#1A5C18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-sans text-ink font-bold text-base mb-1">Message sent!</p>
              <p className="font-sans text-ink-2 text-sm">We&rsquo;ll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium font-sans text-ink mb-1.5">
                  Full name <span className="text-orange">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Smith"
                  className="w-full font-sans text-sm text-ink bg-white border border-[#D4D5D7] rounded-[10px] px-3 py-2.5 placeholder:text-ink-3 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium font-sans text-ink mb-1.5">
                  Email <span className="text-orange">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="jane@company.com"
                  className="w-full font-sans text-sm text-ink bg-white border border-[#D4D5D7] rounded-[10px] px-3 py-2.5 placeholder:text-ink-3 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium font-sans text-ink mb-1.5">
                  Company
                  <span className="font-normal text-ink-3 ml-1.5" style={{ fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Energy"
                  className="w-full font-sans text-sm text-ink bg-white border border-[#D4D5D7] rounded-[10px] px-3 py-2.5 placeholder:text-ink-3 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium font-sans text-ink mb-1.5">
                  Subject <span className="text-orange">*</span>
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full font-sans text-sm text-ink bg-white border border-[#D4D5D7] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                >
                  {SUBJECTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium font-sans text-ink mb-1.5">
                  Message <span className="text-orange">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help..."
                  className="w-full font-sans text-sm text-ink bg-white border border-[#D4D5D7] rounded-[10px] px-3 py-2.5 placeholder:text-ink-3 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all resize-none"
                  style={{ minHeight: '120px' }}
                />
              </div>

              <Button type="submit" variant="primary" loading={loading} className="w-full mt-1">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
