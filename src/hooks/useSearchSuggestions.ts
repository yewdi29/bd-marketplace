'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
// Shared between the desktop nav SearchBar dropdown and the mobile/tablet
// full-screen search takeover — same matching logic, same live counts, same
// keyboard navigation, wherever the suggestions are rendered.

export interface Suggestion {
  label: string
  count: number
  type: 'industry' | 'category'
  slug: string
}

export interface ListingSuggestion {
  id: string
  title: string
  slug: string
}

export type NavItem =
  | { kind: 'suggestion'; data: Suggestion }
  | { kind: 'listing'; data: ListingSuggestion }

// ─── search_queries log — accumulates real search behavior for future
// popularity-ranked suggestions, not yet used in ranking logic. ───────────────
export function logSearch(payload: { query_text: string; results_count?: number | null; clicked_result_id?: string | null }) {
  fetch('/api/search-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Logging is passive — never let it affect the search experience
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// `value` is owned by the caller (each presentation has its own input).
// `enabled` lets non-suggestion variants (e.g. the hero search bar) skip
// fetching entirely without breaking the rules-of-hooks.
export function useSearchSuggestions(value: string, enabled: boolean) {
  const [suggestions, setSuggestions]               = useState<Suggestion[]>([])
  const [listingMatches, setListingMatches]         = useState<ListingSuggestion[]>([])
  const [loading, setLoading]                       = useState(false)
  const [highlightedIndex, setHighlightedIndex]     = useState(-1)
  const latestTermRef = useRef('')
  const router = useRouter()

  const navItems: NavItem[] = [
    ...suggestions.map((data): NavItem => ({ kind: 'suggestion', data })),
    ...listingMatches.map((data): NavItem => ({ kind: 'listing', data })),
  ]

  // Typing further always resets keyboard focus back to the top of the list
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [value])

  useEffect(() => {
    if (!enabled) return
    const term = value.trim()
    if (term.length < 2) {
      setSuggestions([])
      setListingMatches([])
      setLoading(false)
      return
    }
    const handle = setTimeout(async () => {
      latestTermRef.current = term
      setLoading(true)
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
        if (latestTermRef.current === term) setLoading(false)
      }
    }, 200)
    return () => clearTimeout(handle)
  }, [value, enabled])

  function clearResults() {
    setSuggestions([])
    setListingMatches([])
    setHighlightedIndex(-1)
  }

  function goToSuggestion(s: Suggestion) {
    logSearch({ query_text: value.trim(), results_count: s.count })
    setHighlightedIndex(-1)
    const param = s.type === 'industry' ? 'industry' : 'cat'
    router.push(`/search?${param}=${encodeURIComponent(s.slug)}`)
  }

  function goToListing(l: ListingSuggestion) {
    logSearch({ query_text: value.trim(), clicked_result_id: l.id })
    setHighlightedIndex(-1)
    router.push(`/listings/${l.slug}`)
  }

  function selectNavItem(item: NavItem) {
    if (item.kind === 'suggestion') goToSuggestion(item.data)
    else goToListing(item.data)
  }

  // Down/Up move the highlight one row at a time, stopping at the list's edges
  // rather than wrapping. Enter selects the highlighted row. Escape and a
  // keyboard-driven select both defer to the caller — closing a dropdown vs.
  // closing a full-screen takeover are presentation-specific, not the hook's
  // concern, so each caller supplies its own "close" behavior.
  function handleKeyDown(
    e: React.KeyboardEvent,
    isOpen: boolean,
    callbacks?: { onEscape?: () => void; onSelect?: () => void },
  ) {
    if (!isOpen) return

    if (e.key === 'ArrowDown' && navItems.length > 0) {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, navItems.length - 1))
    } else if (e.key === 'ArrowUp' && navItems.length > 0) {
      e.preventDefault()
      setHighlightedIndex(i => (i <= 0 ? -1 : i - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < navItems.length) {
        e.preventDefault()
        callbacks?.onSelect?.()
        selectNavItem(navItems[highlightedIndex])
      }
      // No highlight — let the form submit normally as a raw text search
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1)
      callbacks?.onEscape?.()
    }
  }

  return {
    suggestions,
    listingMatches,
    loading,
    highlightedIndex,
    setHighlightedIndex,
    navItems,
    clearResults,
    goToSuggestion,
    goToListing,
    selectNavItem,
    handleKeyDown,
  }
}
