import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/site'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Membership plans for equipment sellers — from Free to Enterprise teams.',
  alternates: { canonical: canonicalUrl('/pricing') },
}

export default function PricingPage() {
  return <PricingPageClient />
}
