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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex w-full gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 min-w-0 bg-white text-sm font-sans text-ink placeholder:text-ink-3 px-4 focus:outline-none focus:border-orange transition-colors"
          style={{
            height: '40px',
            borderRadius: '100px',
            border: '1.5px solid #E8E9EA',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow disabled:opacity-50 shrink-0"
          style={{ height: '40px' }}
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500 font-sans mt-2">{message}</p>
      )}
    </form>
  )
}
