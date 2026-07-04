'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DiamondLogo from '@/components/rigburrito/DiamondLogo'

export default function VerifyMfaPage() {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [factorId, setFactorId] = useState('')
  const [noFactor, setNoFactor] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    async function loadFactor() {
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) {
        setFactorId(verified.id)
      } else {
        setNoFactor(true)
      }
    }
    loadFactor()
  }, [supabase.auth])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || code.length !== 6) return

    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })

    if (verifyError) {
      const next = attempts + 1
      setAttempts(next)
      setError('Invalid code. Please try again.')
      setCode('')
      setLoading(false)

      if (next >= 3) {
        await supabase.auth.signOut()
        router.push('/rigburrito/login?error=Too many failed attempts. Please sign in again.')
      }
      return
    }

    router.push('/rigburrito')
    router.refresh()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) setCode(pasted)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <DiamondLogo className="mb-4" size={64} />
          <h1 className="text-xl font-semibold text-white">Verify Identity</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Enter your authenticator code</p>
        </div>

        <div
          className="rounded-xl p-8"
          style={{ background: '#1A1D23', border: '1px solid #2D3139' }}
        >
          {noFactor ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-[#9CA3AF]">No authenticator is set up yet.</p>
              <button
                type="button"
                onClick={() => router.push('/rigburrito/setup-mfa')}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: '#FF6B35', border: 'none', cursor: 'pointer' }}
              >
                Set Up MFA
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify}>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onPaste={handlePaste}
                className="mb-4 w-full rounded-lg px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-white outline-none"
                style={{ background: '#0F1117', border: '1px solid #2D3139' }}
                autoFocus
                aria-label="6-digit verification code"
              />

              {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: '#FF6B35', border: 'none', cursor: 'pointer', opacity: code.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          <Link
            href="/rigburrito/login"
            className="rigburrito-text-link mt-4 block text-center text-sm"
            style={{ color: '#6B7280' }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
