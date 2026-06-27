'use client'

import { useState } from 'react'

interface ListingCardSaveButtonProps {
  listingId: string
  isLoggedIn: boolean
  initialSaved?: boolean
  onUnsave?: (listingId: string) => void
}

export default function ListingCardSaveButton({
  listingId,
  isLoggedIn,
  initialSaved = false,
  onUnsave,
}: ListingCardSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setSaving(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch(`/api/saved/${listingId}`, { method })
      if (res.ok) {
        setSaved(s => !s)
        if (saved) onUnsave?.(listingId)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
      className="gallery-action-pill w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-50"
    >
      <svg
        className="w-4 h-4"
        fill={saved ? '#CC0000' : 'none'}
        viewBox="0 0 24 24"
        stroke={saved ? '#CC0000' : '#9A9DA2'}
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
