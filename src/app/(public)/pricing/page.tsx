import type { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Membership plans for equipment sellers — from Free to Enterprise teams.',
  alternates: { canonical: 'https://blackdiamondmkt.com/pricing' },
}

export default function PricingPage() {
  return <PricingPageClient />
}
