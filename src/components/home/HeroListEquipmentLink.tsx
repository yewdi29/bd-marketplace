'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { sellerPortalHref } from '@/lib/sellerPortal'

export default function HeroListEquipmentLink() {
  const { authUser } = useAuth()
  const href = sellerPortalHref(!!authUser, { newListing: true })

  return (
    <Link
      href={href}
      className="inline-flex items-center px-[18px] py-2 bg-orange text-white rounded-pill font-bold text-[13px] no-underline whitespace-nowrap font-sans transition-all duration-200 hover:bg-orange-lt"
      style={{ boxShadow: '0 6px 20px rgba(255,107,53,0.3)' }}
    >
      List Your Equipment
    </Link>
  )
}
