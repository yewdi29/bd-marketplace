'use client'

import { useFlagIconsCss } from '@/hooks/useFlagIconsCss'

/** Loads flag-icons CSS for server-rendered country flags on listing cards. */
export default function ListingCardFlagStyles() {
  useFlagIconsCss()
  return null
}
