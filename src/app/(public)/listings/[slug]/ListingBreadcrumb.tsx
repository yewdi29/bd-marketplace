'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  category: string
  categoryLabel: string
  title: string
}

function BackIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

// Desktop (≥1024px): unchanged breadcrumb trail. Mobile/tablet (<1024px):
// a simple Back button using browser history, since a breadcrumb can't
// know which page the user actually came from.
export default function ListingBreadcrumb({ category, categoryLabel, title }: Props) {
  const router = useRouter()

  return (
    <div className="py-3 lg:py-4">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="flex lg:hidden items-center gap-1.5 text-ink-2 hover:text-ink transition-colors font-sans font-medium"
        style={{ fontSize: '13px', minHeight: 44 }}
      >
        <BackIcon />
        Back
      </button>

      <div className="hidden lg:flex items-center gap-2" style={{ fontSize: '12px' }}>
        <Link href="/listings" className="text-ink-3 hover:text-ink transition-colors font-sans">
          Browse
        </Link>
        <span className="text-ink-3">/</span>
        <Link
          href={`/search?category=${category}`}
          className="text-ink-3 hover:text-ink transition-colors font-sans"
        >
          {categoryLabel}
        </Link>
        <span className="text-ink-3">/</span>
        <span className="text-ink font-sans font-medium truncate max-w-[300px]">{title}</span>
      </div>
    </div>
  )
}
