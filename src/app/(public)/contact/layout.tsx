import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'Contact Black Diamond Marketplace about listing equipment, membership, partnerships, or buyer support. We typically respond within one business day.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
