'use client'

import { useState } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'

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
      setMessage("You're subscribed. We'll be in touch.")
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="border border-gold/30 bg-gold/5 px-6 py-4 text-center">
        <p className="font-body text-sm text-gold">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" variant="primary" size="md" loading={status === 'loading'}>
        Subscribe
      </Button>
      {status === 'error' && (
        <p className="text-xs text-red-400 font-body mt-1 w-full">{message}</p>
      )}
    </form>
  )
}
