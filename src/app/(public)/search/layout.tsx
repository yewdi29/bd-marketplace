import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Heavy Equipment',
  description:
    'Search thousands of verified heavy equipment listings across oil and gas, construction, mining, agriculture, forestry, and trucks and trailers.',
  alternates: { canonical: 'https://blackdiamondmkt.com/search' },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
