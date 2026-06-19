'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useGlowBorder } from '@/hooks/useGlowBorder'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /**
   * 'nav'  — inside Navbar/DashboardNav: rgba glass bg, blur(8px).
   *          Canvas glow activates on focus and fades on blur.
   *          When on /search, syncs value from URL ?q= and debounces updates (300 ms).
   *          Also shows a live, keyboard-navigable suggestions dropdown sourced
   *          from industries/categories/search_keywords, falling back to
   *          matching listing titles when nothing in the taxonomy has inventory.
   * 'hero' — standalone hero section: white bg.
   *          Canvas glow activates on focus and fades on blur (same hook, default options).
   */
  variant: 'nav' | 'hero'
  placeholder?: string
  defaultValue?: string
  className?: string
}

interface Suggestion {
  label: string
  count: number
  type: 'industry' | 'category'
  slug: string
}

interface ListingSuggestion {
  id: string
  title: string
  slug: string
}

// A flat, keyboard-navigable view over both suggestion groups
type NavItem =
  | { kind: 'suggestion'; data: Suggestion }
  | { kind: 'listing'; data: ListingSuggestion }

// ─── search_queries log — accumulates real search behavior for future
// popularity-ranked suggestions, not yet used in ranking logic. ───────────────
function logSearch(payload: { query_text: string; results_count?: number | null; clicked_result_id?: string | null }) {
  fetch('/api/search-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Logging is passive — never let it affect the search experience
  })
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

  // Canvas glow refs
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onFocus: glowFocus, onBlur: glowBlur } = useGlowBorder(canvasRef, containerRef)

  // Are we currently on the search/browse page?
  const isSearchPage = pathname === '/search'

  // ── Sync input value from URL ?q= when on /search ───────────────────────────
  const urlQ = isSearchPage ? (searchParams.get('q') ?? '') : ''
  useEffect(() => {
    if (isSearchPage) setValue(urlQ)
  }, [isSearchPage, urlQ])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live suggestions dropdown — navbar variant only ─────────────────────────
  const [suggestions, setSuggestions]               = useState<Suggestion[]>([])
  const [listingMatches, setListingMatches]         = useState<ListingSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [dropdownOpen, setDropdownOpen]             = useState(false)
  const [highlightedIndex, setHighlightedIndex]     = useState(-1)
  const latestTermRef = useRef('')

  const navItems: NavItem[] = [
    ...suggestions.map((data): NavItem => ({ kind: 'suggestion', data })),
    ...listingMatches.map((data): NavItem => ({ kind: 'listing', data })),
  ]

  useEffect(() => {
    if (variant !== 'nav') return
    const term = value.trim()
    if (term.length < 2) {
      setSuggestions([])
      setListingMatches([])
      setLoadingSuggestions(false)
      return
    }
    const handle = setTimeout(async () => {
      latestTermRef.current = term
      setLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/listings/suggestions?q=${encodeURIComponent(term)}`)
        if (res.ok) {
          const data = await res.json() as { suggestions: Suggestion[]; listings: ListingSuggestion[] }
          // Ignore stale responses from an earlier, slower request
          if (latestTermRef.current === term) {
            setSuggestions(data.suggestions ?? [])
            setListingMatches(data.listings ?? [])
          }
        }
      } catch {
        // Network hiccup — fail silently, suggestions are a non-critical enhancement
      } finally {
        if (latestTermRef.current === term) setLoadingSuggestions(false)
      }
    }, 200)
    return () => clearTimeout(handle)
  }, [value, variant])

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

  function goToSuggestion(s: Suggestion) {
    logSearch({ query_text: value.trim(), results_count: s.count })
    setDropdownOpen(false)
    setHighlightedIndex(-1)
    const param = s.type === 'industry' ? 'industry' : 'cat'
    router.push(`/search?${param}=${encodeURIComponent(s.slug)}`)
  }

  function goToListing(l: ListingSuggestion) {
    logSearch({ query_text: value.trim(), clicked_result_id: l.id })
    setDropdownOpen(false)
    setHighlightedIndex(-1)
    router.push(`/listings/${l.slug}`)
  }

  function selectNavItem(item: NavItem) {
    if (item.kind === 'suggestion') goToSuggestion(item.data)
    else goToListing(item.data)
  }

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  // Down/Up move the highlight one row at a time, stopping at the list's edges
  // rather than wrapping. Enter selects the highlighted row (same as a click).
  // Escape closes the dropdown without selecting and leaves focus in the input.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (variant !== 'nav' || !dropdownOpen || navItems.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, navItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => (i <= 0 ? -1 : i - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < navItems.length) {
        e.preventDefault()
        selectNavItem(navItems[highlightedIndex])
      }
      // No highlight — let the form submit normally as a raw text search
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setHighlightedIndex(-1)
    }
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
    setSuggestions([])
    setListingMatches([])
    setHighlightedIndex(-1)
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

        {/* Canvas glow layer — behind the pill, z-index 0 */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', zIndex: 0, pointerEvents: 'none' }}
        />

        {/* Input pill — z-index 1, above canvas */}
        <div ref={containerRef} className="flex items-center overflow-hidden" style={pillStyle}>

          {/* Search icon */}
          <span className="pl-3.5 text-ink-3 shrink-0">
            <SearchIcon />
          </span>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setDropdownOpen(true); setHighlightedIndex(-1) }}
            onFocus={() => { setFocused(true); glowFocus(); if (variant === 'nav') setDropdownOpen(true) }}
            onBlur={() => { setFocused(false); glowBlur() }}
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
