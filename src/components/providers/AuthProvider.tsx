'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Subscription } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ProfileUser } from '@/components/ui/ProfileDropdown'

export type InitialAuth = { id: string; email: string } | null

type AuthContextValue = {
  authUser: ProfileUser | null
}

const AuthContext = createContext<AuthContextValue>({ authUser: null })

function minimalProfile(email: string): ProfileUser {
  return {
    email,
    full_name: null,
    company_name: null,
    plan: 'free',
    listing_count: 0,
  }
}

function scheduleIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(fn, { timeout: 2000 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 1)
  return () => clearTimeout(id)
}

export function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: InitialAuth
  children: ReactNode
}) {
  const [authUser, setAuthUser] = useState<ProfileUser | null>(() =>
    initialAuth ? minimalProfile(initialAuth.email) : null,
  )

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let subscription: Subscription | null = null

    async function loadProfile(userId: string, email: string) {
      setAuthUser(minimalProfile(email))
      const [profileRes, countRes, orgMemberRes] = await Promise.all([
        supabase.from('users').select('full_name, company_name, plan').eq('id', userId).single(),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .neq('status', 'removed'),
        supabase
          .from('org_members')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
      ])
      if (cancelled) return
      setAuthUser({
        email,
        full_name: profileRes.data?.full_name ?? null,
        company_name: profileRes.data?.company_name ?? null,
        plan: profileRes.data?.plan ?? 'free',
        listing_count: countRes.count ?? 0,
        has_organization: Boolean(orgMemberRes.data),
      })
    }

    const cancelIdle = scheduleIdle(() => {
      if (cancelled) return

      if (initialAuth) {
        loadProfile(initialAuth.id, initialAuth.email)
      }

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return
        if (session?.user) {
          if (event === 'INITIAL_SESSION' && initialAuth?.id === session.user.id) return
          loadProfile(session.user.id, session.user.email ?? '')
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
        }
      })
      subscription = sub
    })

    return () => {
      cancelled = true
      cancelIdle()
      subscription?.unsubscribe()
    }
  }, [initialAuth?.id, initialAuth?.email])

  return (
    <AuthContext.Provider value={{ authUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
