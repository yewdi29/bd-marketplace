import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Join Black Diamond Marketplace and start listing or sourcing heavy equipment with verified buyers and sellers worldwide.',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
