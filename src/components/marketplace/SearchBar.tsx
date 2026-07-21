'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { GlowBorderHandle } from '@/components/ui/GlowBorderCanvas'
import { useSearchSuggestions, logSearch } from '@/hooks/useSearchSuggestions'

const GlowBorderCanvas = dynamic(() => import('@/components/ui/GlowBorderCanvas'), {
  ssr: false,
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /**
   * 'nav'  — inside Navbar/DashboardNav: rgba glass bg, blur(8px).
   *          Canvas glow activates on focus and fades on blur.
   *          When on /search, syncs value from URL ?q= and debounces updates (300 ms).
   *          Also shows a live, keyboard-navigable suggestions dropdown sourced
   *          from industries/categories/search_keywords, falling back to
   *          matching listing titles when nothing in the taxonomy has inventory.
   *          (Suggestion fetching/matching/keyboard-nav logic lives in
   *          useSearchSuggestions, shared with the mobile/tablet full-screen
   *          search takeover — same behavior everywhere.)
   * 'hero' — standalone hero section: white bg.
   *          Canvas glow activates on focus and fades on blur (same hook, default options).
   */
  variant: 'nav' | 'hero'
  placeholder?: string
  defaultValue?: string
  className?: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchBar({
  variant,
  placeholder,
  defaultValue = '',
  className = '',
}: SearchBarProps) {
  const [value, setValue]     = useState(defaultValue)
  const [focused, setFocused] = useState(false)

  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const inputRef     = useRef<HTMLInputElement>(null)
  const wrapperRef   = useRef<HTMLFormElement>(null)

  // Canvas glow — lazy-mounted on first focus/click so animation code stays off the critical path
  const containerRef = useRef<HTMLDivElement>(null)
  const glowHandleRef = useRef<GlowBorderHandle | null>(null)
  const [glowMounted, setGlowMounted] = useState(false)
  const pendingGlowFocusRef = useRef(false)

  function armGlow(focus: boolean) {
    if (!glowMounted) {
      if (focus) pendingGlowFocusRef.current = true
      setGlowMounted(true)
      return
    }
    if (focus) glowHandleRef.current?.focus()
    else glowHandleRef.current?.blur()
  }

  function handleGlowReady(handle: GlowBorderHandle) {
    glowHandleRef.current = handle
    if (pendingGlowFocusRef.current) {
      pendingGlowFocusRef.current = false
      handle.focus()
    }
  }

  // Are we currently on the search/browse page?
  const isSearchPage = pathname === '/search'

  // ── Sync input value from URL ?q= when on /search ───────────────────────────
  const urlQ = isSearchPage ? (searchParams.get('q') ?? '') : ''
  useEffect(() => {
    if (isSearchPage) setValue(urlQ)
  }, [isSearchPage, urlQ])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live suggestions dropdown — navbar variant only ─────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const {
    suggestions, listingMatches, loading: loadingSuggestions,
    highlightedIndex, setHighlightedIndex, navItems,
    clearResults, goToSuggestion: goTo, goToListing: goToListingItem, handleKeyDown: suggestionsKeyDown,
  } = useSearchSuggestions(value, variant === 'nav')

  // Close dropdown on outside click
  useEffect(() => {
    if (variant !== 'nav') return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [variant])

  function goToSuggestion(s: Parameters<typeof goTo>[0]) {
    setDropdownOpen(false)
    goTo(s)
  }

  function goToListing(l: Parameters<typeof goToListingItem>[0]) {
    setDropdownOpen(false)
    goToListingItem(l)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const closeDropdown = () => setDropdownOpen(false)
    suggestionsKeyDown(e, variant === 'nav' && dropdownOpen, { onEscape: closeDropdown, onSelect: closeDropdown })
  }

  // ── Submit handler ──────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q) logSearch({ query_text: q })
    setDropdownOpen(false)
    setHighlightedIndex(-1)

    if (isSearchPage) {
      const next = new URLSearchParams(searchParams.toString())
      if (q) next.set('q', q)
      else next.delete('q')
      router.replace(`/search${next.toString() ? `?${next.toString()}` : ''}`)
    } else {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    }
  }

  function handleClear() {
    setValue('')
    clearResults()
    inputRef.current?.focus()
    if (isSearchPage) {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('q')
      router.replace(`/search${next.toString() ? `?${next.toString()}` : ''}`)
    }
  }

  // ── Pill styles ─────────────────────────────────────────────────────────────
  // Border goes transparent on focus so the canvas glow takes over visually.
  const pillStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    height: '40px',
    borderRadius: '100px',
    border: `1.5px solid ${focused ? 'transparent' : '#E8E9EA'}`,
    background: variant === 'nav' ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
    ...(variant === 'nav'
      ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
      : {}),
    transition: 'border-color 0.15s',
  }

  const resolvedPlaceholder =
    placeholder ?? (variant === 'nav' ? 'Search equipment...' : 'Search drill pipe, BOP, rigs...')

  const showDropdown = variant === 'nav' && dropdownOpen && (loadingSuggestions || navItems.length > 0)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`} ref={wrapperRef}>
      {/* Outer wrapper — canvas is positioned relative to this */}
      <div className="relative">

        {/* Canvas glow layer — mounted on first interaction */}
        {glowMounted && (
          <GlowBorderCanvas
            containerRef={containerRef}
            onReady={handleGlowReady}
          />
        )}

        {/* Input pill — z-index 1, above canvas */}
        <div
          ref={containerRef}
          className="flex items-center overflow-hidden"
          style={pillStyle}
          onPointerDown={() => armGlow(false)}
        >

          {/* Search icon */}
          <span className="pl-3.5 text-ink-3 shrink-0">
            <SearchIcon />
          </span>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setDropdownOpen(true) }}
            onFocus={() => { setFocused(true); armGlow(true); if (variant === 'nav') setDropdownOpen(true) }}
            onBlur={() => { setFocused(false); armGlow(false) }}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            className="flex-1 bg-transparent text-sm font-sans text-ink placeholder:text-ink-3 focus:outline-none px-2.5 h-full"
          />

          {/* Clear — visible when input has a value */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="text-ink-3 hover:text-ink transition-colors shrink-0 pr-1.5"
            >
              <ClearIcon />
            </button>
          )}

          {/* Submit arrow */}
          <button
            type="submit"
            aria-label="Search"
            className="pr-3 text-ink-3 hover:text-orange transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

        </div>

        {/* Suggestions dropdown — navbar variant only */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8E9EA] overflow-hidden"
            style={{ top: '100%', zIndex: 20, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
          >
            {loadingSuggestions && navItems.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="h-3.5 bg-[#F0F0F0] rounded-full animate-pulse" style={{ width: `${120 - i * 15}px` }} />
                  <span className="h-3 w-6 bg-[#F0F0F0] rounded-full animate-pulse shrink-0" />
                </div>
              ))
            ) : (
              <>
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.type}:${s.slug}:${s.label}`}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => goToSuggestion(s)}
                    className={[
                      'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors',
                      i === highlightedIndex ? 'bg-bg' : 'hover:bg-bg',
                    ].join(' ')}
                  >
                    <span className="text-sm font-sans text-ink-2 truncate">{s.label}</span>
                    <span className="text-xs font-sans text-ink-3 shrink-0 whitespace-nowrap">
                      {s.count}
                    </span>
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
                          onMouseEnter={() => setHighlightedIndex(i)}
                          onClick={() => goToListing(l)}
                          className={[
                            'w-full text-left px-4 py-2.5 transition-colors',
                            i === highlightedIndex ? 'bg-bg' : 'hover:bg-bg',
                          ].join(' ')}
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
        )}
      </div>
    </form>
  )
}
