'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ListingGalleryNavContextValue {
  itemCount: number
  gridOpen: boolean
  openGrid: () => void
  closeGrid: () => void
}

const ListingGalleryNavContext = createContext<ListingGalleryNavContextValue | null>(null)

export function ListingGalleryNavProvider({
  itemCount,
  children,
}: {
  itemCount: number
  children: React.ReactNode
}) {
  const [gridOpen, setGridOpen] = useState(false)

  const openGrid = useCallback(() => setGridOpen(true), [])
  const closeGrid = useCallback(() => setGridOpen(false), [])

  return (
    <ListingGalleryNavContext.Provider value={{ itemCount, gridOpen, openGrid, closeGrid }}>
      {children}
    </ListingGalleryNavContext.Provider>
  )
}

export function useListingGalleryNav() {
  return useContext(ListingGalleryNavContext)
}
