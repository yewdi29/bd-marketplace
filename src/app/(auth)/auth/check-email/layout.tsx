import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Check Email',
  description:
    'We sent you a confirmation email. Click the link inside to activate your account.',
  path: '/auth/check-email',
  noindex: true,
})

export default function CheckEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
