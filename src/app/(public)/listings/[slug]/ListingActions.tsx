'use client'

import { useState } from 'react'

interface Props {
  listingId: string
  initialSaved: boolean
  isLoggedIn: boolean
  listingTitle: string
}

export default function ListingActions({ listingId, initialSaved, isLoggedIn, listingTitle }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [savingLoading, setSavingLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSave() {
    if (!isLoggedIn) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setSavingLoading(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch(`/api/saved/${listingId}`, { method })
      if (res.ok) setSaved(s => !s)
    } finally {
      setSavingLoading(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — select the URL
    }
  }

  const emailSubject = encodeURIComponent(`Check out this listing: ${listingTitle}`)
  const emailBody = encodeURIComponent(`I found this equipment listing on Black Diamond Marketplace:\n\n${typeof window !== 'undefined' ? window.location.href : ''}`)

  return (
    <div className="flex flex-col gap-2 mt-3">
      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={savingLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold border rounded-pill transition-colors disabled:opacity-50"
        style={{
          borderColor: saved ? '#FF6B35' : '#D4D5D7',
          color: saved ? '#FF6B35' : '#4A4D52',
        }}
      >
        <svg
          className="w-4 h-4 transition-colors"
          fill={saved ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ color: saved ? '#FF6B35' : '#9A9DA2' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {saved ? 'Saved' : 'Save Listing'}
      </button>

      {/* Share row */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink-2 border border-[#E8E9EA] rounded-pill hover:border-[#D4D5D7] hover:text-ink transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-[#1A5C18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy link
            </>
          )}
        </button>

        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink-2 border border-[#E8E9EA] rounded-pill hover:border-[#D4D5D7] hover:text-ink transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </a>
      </div>
    </div>
  )
}
