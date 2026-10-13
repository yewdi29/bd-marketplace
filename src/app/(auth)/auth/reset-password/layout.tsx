import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Reset Password',
  path: '/auth/reset-password',
  noindex: true,
})

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
