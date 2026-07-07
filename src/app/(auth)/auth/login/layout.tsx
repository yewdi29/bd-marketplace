import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Black Diamond Marketplace account to manage listings, view inquiries, and connect with buyers and sellers worldwide.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
