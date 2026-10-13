import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Account',
  description:
    'Join Black Diamond Marketplace and start listing or sourcing heavy equipment with verified buyers and sellers worldwide.',
  path: '/auth/signup',
  noindex: true,
})

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
