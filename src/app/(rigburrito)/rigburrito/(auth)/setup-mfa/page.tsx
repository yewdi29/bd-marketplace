'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import DiamondLogo from '@/components/rigburrito/DiamondLogo'
import { resetMfaFactors } from '@/lib/rigburrito/mfa-client'

export default function SetupMfaPage() {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(false)

  const [qrUri, setQrUri] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(true)

  const startEnrollment = useCallback(async (forceReset = false) => {
    setEnrolling(true)
    setError('')
    setQrUri('')
    setSecret('')
    setFactorId('')

    if (forceReset) {
      await resetMfaFactors()
    }

    const { data: existing } = await supabase.auth.mfa.listFactors()
    const verified = existing?.totp?.find(f => f.status === 'verified')
    if (verified) {
      router.push('/rigburrito/verify')
      router.refresh()
      return
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin Authenticator',
    })

    if (enrollError) {
      const alreadyExists = enrollError.message.toLowerCase().includes('already exists')
      if (alreadyExists && !forceReset) {
        await startEnrollment(true)
        return
      }
      setError(enrollError.message)
      setEnrolling(false)
      return
    }

    setQrUri(data.totp.uri)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    setEnrolling(false)
  }, [router, supabase.auth])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    startEnrollment()
  }, [startEnrollment])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter a 6-digit code')
      return
    }
    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    router.push('/rigburrito')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <DiamondLogo className="mb-4" size={64} />
          <h1 className="text-xl font-semibold text-white">Set Up Two-Factor Auth</h1>
        </div>

        <div
          className="rounded-xl p-8"
          style={{ background: '#1A1D23', border: '1px solid #2D3139' }}
        >
          {enrolling ? (
            <p className="text-center text-sm text-[#9CA3AF]">Generating QR code...</p>
          ) : error && !qrUri ? (
            <p className="text-center text-sm text-red-400">{error}</p>
          ) : (
            <>
              <p className="mb-6 text-sm leading-relaxed text-[#9CA3AF]">
                Scan this QR code with Google Authenticator or Authy. You will need this app every time you log in.
              </p>

              {qrUri && (
                <div className="mb-4 flex justify-center rounded-lg bg-white p-4">
                  <QRCodeSVG value={qrUri} size={180} />
                </div>
              )}

              {secret && (
                <div className="mb-6">
                  <p className="mb-1 text-xs text-[#6B7280]">Manual entry code</p>
                  <p className="break-all font-mono text-sm text-white">{secret}</p>
                </div>
              )}

              <form onSubmit={handleVerify}>
                <label htmlFor="code" className="mb-1.5 block text-sm text-[#9CA3AF]">6-digit code</label>
                <input
                  ref={inputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mb-4 w-full rounded-lg px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white outline-none"
                  style={{ background: '#0F1117', border: '1px solid #2D3139' }}
                  autoFocus
                />

                {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                  style={{ background: '#FF6B35', border: 'none', cursor: 'pointer' }}
                >
                  {loading ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
