import Link from 'next/link'
import type { ReactNode } from 'react'

interface HomeSectionHeaderProps {
  children: ReactNode
  linkHref: string
  linkLabel: string
}

const VIEW_ALL_LINK_CLASS =
  'text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors shrink-0 self-start sm:self-auto'

/** Homepage section title block + optional "View all" / "Browse all" link. */
export default function HomeSectionHeader({
  children,
  linkHref,
  linkLabel,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div className="min-w-0">{children}</div>
      <Link href={linkHref} className={VIEW_ALL_LINK_CLASS}>
        {linkLabel}
      </Link>
    </div>
  )
}
