import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing',
  description: 'Membership plans for equipment sellers — from Free to Enterprise teams.',
  path: '/pricing',
})

export default function PricingPage() {
  return <PricingPageClient />
}
