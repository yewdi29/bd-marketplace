'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import ProfileDropdown from '@/components/ui/ProfileDropdown'

export default function NavbarDesktopAuth({
  loggedOut,
}: {
  loggedOut: ReactNode
}) {
  const { authUser } = useAuth()
  return authUser ? <ProfileDropdown user={authUser} /> : loggedOut
}
