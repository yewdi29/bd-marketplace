'use client'

import { useState } from 'react'

export default function NewsletterCTA() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrMsg('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'knowledge_base' }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json()
        setErrMsg(data.error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrMsg('Could not connect. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div
      className="bg-white text-center shadow-card"
      style={{ borderRadius: '20px', padding: '48px 32px' }}
    >
      <h2
        className="font-sans font-bold text-ink mb-3"
        style={{ fontSize: '24px', letterSpacing: '-0.02em' }}
      >
        Stay ahead of the market
      </h2>
      <p className="font-sans text-ink-3 leading-relaxed mx-auto mb-6" style={{ fontSize: '15px', maxWidth: '480px' }}>
        Equipment guides, market updates, and inventory alerts — straight to your inbox.
        No spam. Unsubscribe any time.
      </p>

      {status === 'success' ? (
        <p className="font-sans text-sm font-semibold text-orange">
          ✓ You&apos;re on the list. Talk soon.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex justify-center gap-3 mx-auto"
          style={{ maxWidth: '440px' }}
        >
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 bg-bg border border-[#D4D5D7] rounded-pill text-sm font-sans text-ink placeholder:text-ink-3 focus:outline-none focus:border-orange transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-2.5 text-sm font-bold text-white bg-orange hover:bg-orange-lt rounded-pill transition-colors shadow-orange-glow disabled:opacity-60 shrink-0"
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && errMsg && (
        <p className="mt-3 font-sans text-xs text-red-500">{errMsg}</p>
      )}
    </div>
  )
}
