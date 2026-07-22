'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { sellerPortalHref } from '@/lib/sellerPortal'
import { HERO_CTA_PRIMARY } from '@/components/home/heroCtaClasses'

export default function HeroListEquipmentLink() {
  const { authUser } = useAuth()
  const href = sellerPortalHref(!!authUser, { newListing: true })

  return (
    <Link
      href={href}
      className={HERO_CTA_PRIMARY}
      style={{ boxShadow: '0 6px 20px rgba(255,107,53,0.3)' }}
    >
      List Your Equipment
    </Link>
  )
}
