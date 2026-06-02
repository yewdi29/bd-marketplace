'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /**
   * 'nav'  — inside Navbar/DashboardNav: rgba glass bg, blur(8px), standard orange focus ring.
   *          No moving glow — glass effect is already part of the navbar.
   *          When on /listings, syncs value from URL ?q= and debounces updates (300 ms).
   * 'hero' — standalone hero section: white bg, animated gradient border on focus only
   *          (per §8 Special Effects: Moving Glow).
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
  const [value, setValue]   = useState(defaultValue)
  const [focused, setFocused] = useState(false)

  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const inputRef     = useRef<HTMLInputElement>(null)

  // Are we currently on the listings browse page?
  const isListingsPage = pathname === '/listings'

  // ── Sync input value from URL ?q= when on /listings ────────────────────────
  // Only fires when the URL's q param changes (e.g. a filter pill clears it),
  // not on every keystroke — so typing is never interrupted.
  const urlQ = isListingsPage ? (searchParams.get('q') ?? '') : ''
  useEffect(() => {
    if (isListingsPage) setValue(urlQ)
  }, [isListingsPage, urlQ])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit handler — only fires on Enter or search button click ─────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()

    if (isListingsPage) {
      // Preserve all active filters — only update the q param
      const next = new URLSearchParams(searchParams.toString())
      if (q) next.set('q', q)
      else next.delete('q')
      router.replace(`/listings${next.toString() ? `?${next.toString()}` : ''}`)
    } else {
      // Navigate to listings from any other page (homepage, etc.)
      router.push(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings')
    }
  }

  function handleClear() {
    setValue('')
    inputRef.current?.focus()
    // Remove ?q= from URL immediately when X is clicked on the listings page
    if (isListingsPage) {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('q')
      router.replace(`/listings${next.toString() ? `?${next.toString()}` : ''}`)
    }
  }

  // ── Inner pill styles ───────────────────────────────────────────────────────

  // Hero + focused = animated gradient border (§8 Moving Glow)
  const showGlow = variant === 'hero' && focused

  const innerStyle: React.CSSProperties = {
    height: '40px',
    borderRadius: '100px',
    border: showGlow
      ? 'none'
      : `1.5px solid ${focused ? '#FF6B35' : '#E8E9EA'}`,
    background: variant === 'nav' ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
    ...(variant === 'nav'
      ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
      : {}),
    boxShadow: focused && !showGlow ? '0 0 0 3px rgba(255,107,53,0.08)' : undefined,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const resolvedPlaceholder =
    placeholder ?? (variant === 'nav' ? 'Search equipment...' : 'Search drill pipe, BOP, rigs...')

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      {/*
       * Glow wrapper — hero + focused only.
       * .search-glow-border (globals.css) creates the animated gradient border
       * via 2px padding + animated bg.
       */}
      <div className={showGlow ? 'search-glow-border' : ''}>
        <div className="relative flex items-center" style={innerStyle}>

          {/* Search icon */}
          <span className="pl-3.5 text-ink-3 shrink-0">
            <SearchIcon />
          </span>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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
      </div>
    </form>
  )
}
