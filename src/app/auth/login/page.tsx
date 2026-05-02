'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-widest text-gold">
            BLACK DIAMOND
          </Link>
          <h1 className="mt-4 font-display text-4xl tracking-widest text-white">SIGN IN</h1>
          <p className="mt-2 font-body text-sm text-gray-500">
            Access your marketplace account
          </p>
        </div>

        <div className="bg-surface border border-surface-border p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm font-body text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-display tracking-widest"
            >
              SIGN IN
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="block font-body text-xs text-gray-600 hover:text-gold transition-colors"
            >
              Forgot your password?
            </Link>
            <p className="font-body text-sm text-gray-500">
              No account?{' '}
              <Link href="/auth/signup" className="text-gold hover:text-gold-light transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
