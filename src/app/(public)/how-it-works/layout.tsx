import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { PLAN_LISTING_LIMITS } from '@/lib/planLimits'
import { buildPageMetadata } from '@/lib/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'How It Works',
  description:
    'Buy and sell oilfield and heavy equipment on Black Diamond Marketplace. List in minutes, reach verified buyers, and connect without middlemen.',
  path: '/how-it-works',
})

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is it free to create an account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes. Creating an account and browsing listings is completely free. Sellers on the free plan can post up to ${PLAN_LISTING_LIMITS.free} listings at no cost.`,
      },
    },
    {
      '@type': 'Question',
      name: 'How does the AI listing generation work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You describe your equipment in plain language — what it is, condition, specs, price, location. Our AI structures that into a professional listing with an SEO-optimized title, description, and specifications automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do buyers contact sellers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Buyers submit an inquiry form directly on the listing page. The seller receives the buyer's contact details and responds directly. Black Diamond facilitates the connection but the transaction happens between buyer and seller.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is BD Verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BD Verified is a badge earned by sellers on paid membership plans. It signals to buyers that the seller is an active, committed member of the Black Diamond marketplace.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can Black Diamond help close a deal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — for qualifying transactions sellers can authorize Black Diamond to assist with facilitation. Contact us to discuss brokerage options.',
      },
    },
  ],
}

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {children}
    </>
  )
}
