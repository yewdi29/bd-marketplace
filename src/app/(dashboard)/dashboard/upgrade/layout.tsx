import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description:
    'Choose a Black Diamond Marketplace membership plan. List heavy equipment, reach verified buyers, and grow your business globally.',
  alternates: { canonical: 'https://blackdiamondmkt.com/dashboard/upgrade' },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children
}
