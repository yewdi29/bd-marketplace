'use client'

import { useState } from 'react'

export default function NewsletterForm({ source }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    })

    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage("You're subscribed.")
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm font-sans text-orange">{message}</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1 bg-white border border-[#D4D5D7] text-ink placeholder:text-ink-3 px-4 py-2 text-sm font-sans rounded-pill focus:outline-none focus:border-orange transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50 shrink-0"
      >
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 font-sans mt-1 w-full">{message}</p>
      )}
    </form>
  )
}
