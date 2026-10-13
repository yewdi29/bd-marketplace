import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign In',
  description:
    'Sign in to your Black Diamond Marketplace account to manage listings, view inquiries, and connect with buyers and sellers worldwide.',
  path: '/auth/login',
  noindex: true,
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
