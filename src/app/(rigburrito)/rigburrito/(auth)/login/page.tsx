'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DiamondLogo from '@/components/rigburrito/DiamondLogo'
import RigburritoAuthBackground from '@/components/rigburrito/RigburritoAuthBackground'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('error') ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/')
      router.refresh()
      return
    }

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasVerifiedTotp = factors?.totp?.some(f => f.status === 'verified') ?? false

    if (hasVerifiedTotp) {
      router.push('/rigburrito/verify')
    } else {
      router.push('/rigburrito/setup-mfa')
    }
    router.refresh()
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#131313' }}>
      <RigburritoAuthBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-xl p-8"
            style={{
              background: '#1C1C1C',
              border: '1px solid #2E2E2E',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <DiamondLogo className="mb-4" size={64} />
              <h1 className="text-xl font-semibold text-white">Command Center</h1>
              <p className="mt-1 text-sm" style={{ color: '#737373' }}>Internal access only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm" style={{ color: '#A3A3A3' }}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                  style={{ background: '#111111', border: '1px solid #2E2E2E' }}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm" style={{ color: '#A3A3A3' }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                  style={{ background: '#111111', border: '1px solid #2E2E2E' }}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: '#FF6B35', border: 'none', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
