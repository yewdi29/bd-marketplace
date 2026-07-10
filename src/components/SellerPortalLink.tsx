'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { sellerPortalHref } from '@/lib/sellerPortal'

type SellerPortalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  newListing?: boolean
}

/** Links signed-out users to create an account; signed-in users to the dashboard. */
export default function SellerPortalLink({ newListing = false, ...props }: SellerPortalLinkProps) {
  const { authUser } = useAuth()
  const href = sellerPortalHref(!!authUser, { newListing })
  return <Link href={href} {...props} />
}
