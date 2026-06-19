'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSearchSuggestions, logSearch } from '@/hooks/useSearchSuggestions'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

interface MobileSearchTakeoverProps {
  open: boolean
  onClose: () => void
}

export interface MobileSearchTakeoverHandle {
  focusInput: () => void
}

// Full-screen white search takeover for mobile/tablet (<1024px) — same
// matching logic, live counts, and keyboard navigation as the desktop nav
// SearchBar dropdown (shared via useSearchSuggestions), just presented as a
// full-screen view so the suggestion panel can sit above the mobile keyboard
// instead of floating in a small inline dropdown.
const MobileSearchTakeover = forwardRef<MobileSearchTakeoverHandle, MobileSearchTakeoverProps>(
  function MobileSearchTakeover({ open, onClose }, ref) {
    const router = useRouter()
    const [value, setValue] = useState('')
    const [mounted, setMounted] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const {
      suggestions, listingMatches, loading, highlightedIndex,
      navItems, clearResults, goToSuggestion, goToListing, handleKeyDown,
    } = useSearchSuggestions(value, open)

    useEffect(() => { setMounted(true) }, [])

    useImperativeHandle(ref, () => ({
      focusInput: () => {
        inputRef.current?.focus({ preventScroll: true })
      },
    }), [])

    // Reset query when the takeover opens — focus is handled synchronously
    // from the parent's click handler (flushSync) so iOS keeps user activation.
    useEffect(() => {
      if (!open) return
      setValue('')
      clearResults()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Lock background scroll and handle Escape while open
    useEffect(() => {
      if (!open) return
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = prevOverflow
        document.removeEventListener('keydown', onKeyDown)
      }
    }, [open, onClose])

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      const q = value.trim()
      if (!q) return
      logSearch({ query_text: q })
      onClose()
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    function handleSelectSuggestion(s: Parameters<typeof goToSuggestion>[0]) {
      onClose()
      goToSuggestion(s)
    }

    function handleSelectListing(l: Parameters<typeof goToListing>[0]) {
      onClose()
      goToListing(l)
    }

    if (!mounted || !open) return null

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 bg-white flex flex-col z-[120]"
      >
        {/* Input row */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 shrink-0 border-b border-[#E8E9EA]"
          style={{ height: 64, paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex items-center justify-center shrink-0 text-ink-2 hover:text-ink transition-colors"
            style={{ width: 44, height: 44 }}
          >
            <CloseIcon />
          </button>
          <span className="text-ink-3 shrink-0">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => handleKeyDown(e, open, { onEscape: onClose, onSelect: onClose })}
            placeholder="Search equipment..."
            autoFocus
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            className="flex-1 bg-transparent text-base font-sans text-ink placeholder:text-ink-3 focus:outline-none h-full"
          />
        </form>

        {/* Suggestions — constrained to ~50% of screen height so the keyboard
            always has room beneath it */}
        <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {loading && navItems.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="h-3.5 bg-[#F0F0F0] rounded-full animate-pulse" style={{ width: `${140 - i * 18}px` }} />
                <span className="h-3 w-6 bg-[#F0F0F0] rounded-full animate-pulse shrink-0" />
              </div>
            ))
          ) : (
            <>
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}:${s.slug}:${s.label}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                    i === highlightedIndex ? 'bg-bg' : 'hover:bg-bg',
                  ].join(' ')}
                  style={{ minHeight: 44 }}
                >
                  <span className="text-sm font-sans text-ink-2 truncate">{s.label}</span>
                  <span className="text-xs font-sans text-ink-3 shrink-0 whitespace-nowrap">{s.count}</span>
                </button>
              ))}

              {listingMatches.length > 0 && (
                <>
                  <p
                    className="font-mono uppercase text-ink-3 px-4 pt-3 pb-1"
                    style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                  >
                    Listings
                  </p>
                  {listingMatches.map((l, j) => {
                    const i = suggestions.length + j
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleSelectListing(l)}
                        className={[
                          'w-full text-left px-4 py-3 transition-colors',
                          i === highlightedIndex ? 'bg-bg' : 'hover:bg-bg',
                        ].join(' ')}
                        style={{ minHeight: 44 }}
                      >
                        <span className="text-sm font-sans text-ink-2 truncate">{l.title}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Empty space below — keeps the suggestion panel capped at ~50vh so
            the on-screen keyboard never covers it */}
        <div className="flex-1" />
      </div>,
      document.body
    )
  }
)

export default MobileSearchTakeover
