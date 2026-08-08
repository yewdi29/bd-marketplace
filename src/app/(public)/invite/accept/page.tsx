'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatLocationsLabel } from '@/lib/organizations/teamLocations'
import { createClient } from '@/lib/supabase/client'

function InviteAcceptContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [invite, setInvite] = useState<{
    organizationName: string
    role: string
    teamTag: string[] | null
    invitedEmail: string
    isPrimaryOwner?: boolean
  } | null>(null)

  async function startCheckoutRedirect(organizationId: string) {
    setRedirectingToCheckout(true)
    setError(null)
    try {
      const returnUrl = `${window.location.origin}/dashboard/organization?tab=billing`
      const res = await fetch(`/api/organizations/${organizationId}/payment-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to start checkout')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setRedirectingToCheckout(false)
      setLoading(false)
    }
  }

  function orgRedirect(organizationId?: string, isPrimaryOwner?: boolean) {
    if (isPrimaryOwner && organizationId) {
      void startCheckoutRedirect(organizationId)
      return
    }
    router.replace('/dashboard/organization')
  }

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    async function loadInvite() {
      const res = await fetch(`/api/invite/accept?token=${encodeURIComponent(token!)}`)
      const data = await res.json() as {
        invite?: {
          organizationName: string
          role: string
          teamTag: string[] | null
          invitedEmail: string
          isPrimaryOwner?: boolean
        }
        expired?: boolean
        error?: string
      }

      if (res.status === 410 || data.expired) {
        setExpired(true)
        setLoading(false)
        return
      }

      if (!res.ok || !data.invite) {
        setError(data.error ?? 'Invite not found')
        setLoading(false)
        return
      }

      setInvite(data.invite)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user && user.email?.toLowerCase() === data.invite.invitedEmail.toLowerCase()) {
        const acceptRes = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const acceptData = await acceptRes.json() as {
          success?: boolean
          error?: string
          requiresAuth?: boolean
          isPrimaryOwner?: boolean
          organizationId?: string
        }
        if (acceptRes.ok && acceptData.success) {
          orgRedirect(
            acceptData.organizationId,
            acceptData.isPrimaryOwner ?? data.invite.isPrimaryOwner,
          )
          return
        }
        if (!acceptData.requiresAuth) {
          setError(acceptData.error ?? 'Failed to accept invite')
        }
      }

      setLoading(false)
    }

    void loadInvite()
  }, [token, router])

  async function handleLoginRedirect() {
    const returnUrl = `/invite/accept?token=${encodeURIComponent(token ?? '')}`
    const params = new URLSearchParams({ redirectTo: returnUrl })
    if (invite?.invitedEmail) params.set('email', invite.invitedEmail)
    router.push(`/auth/login?${params.toString()}`)
  }

  if (loading || redirectingToCheckout) {
    return (
      <p className="text-sm text-ink-3">
        {redirectingToCheckout ? 'Redirecting to secure checkout…' : 'Verifying invitation…'}
      </p>
    )
  }

  if (expired) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">This invite has expired</h1>
        <p className="text-sm text-ink-2">
          Ask the person who invited you to send a new invitation from Company Settings.
        </p>
        <Link href="/" className="text-sm text-orange hover:underline">Return home</Link>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">Invitation unavailable</h1>
        <p className="text-sm text-ink-2">{error ?? 'This invite link is not valid.'}</p>
        <Link href="/" className="text-sm text-orange hover:underline">Return home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-ink mb-2">
          {invite.isPrimaryOwner ? `Set up ${invite.organizationName}` : `Join ${invite.organizationName}`}
        </h1>
        <p className="text-sm text-ink-2">
          {invite.isPrimaryOwner
            ? 'You\'ve been designated as the primary Owner. Sign in to accept your invite and continue to secure checkout.'
            : `You've been invited as ${invite.role}${invite.teamTag?.length ? ` for ${formatLocationsLabel(invite.teamTag)}` : ''}.`}
        </p>
        <p className="text-xs text-ink-3 mt-2">Sign in as {invite.invitedEmail} to accept.</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleLoginRedirect}
          className="w-full py-3 text-sm font-semibold text-white bg-orange rounded-pill"
        >
          Sign in to accept
        </button>
        <Link
          href={`/auth/signup?redirectTo=${encodeURIComponent(`/invite/accept?token=${token}`)}&email=${encodeURIComponent(invite.invitedEmail)}`}
          className="w-full py-3 text-sm font-semibold text-ink border border-[#E8E9EA] rounded-pill text-center"
        >
          Create account
        </Link>
      </div>
    </div>
  )
}

export default function InviteAcceptPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-sm text-ink-3">Loading…</p>}>
        <InviteAcceptContent />
      </Suspense>
    </div>
  )
}
