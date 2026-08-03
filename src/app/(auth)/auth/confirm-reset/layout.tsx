import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Continue resetting your Black Diamond Marketplace password.',
  robots: { index: false, follow: false },
}

export default function ConfirmResetLayout({ children }: { children: React.ReactNode }) {
  return children
}
