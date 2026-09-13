import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accept Invite',
  robots: { index: false, follow: false },
}

export default function InviteAcceptLayout({ children }: { children: ReactNode }) {
  return children
}
