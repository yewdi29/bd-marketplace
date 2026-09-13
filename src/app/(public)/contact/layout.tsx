import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Black Diamond Marketplace about listing equipment, membership, partnerships, or buyer support. We typically respond within one business day.',
  alternates: { canonical: canonicalUrl('/contact') },
  openGraph: {
    title: 'Contact | Black Diamond Marketplace',
    description:
      'Contact Black Diamond Marketplace about listing equipment, membership, partnerships, or buyer support.',
    url: canonicalUrl('/contact'),
  },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
