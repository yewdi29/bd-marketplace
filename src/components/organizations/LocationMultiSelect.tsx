'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeTeamLocations } from '@/lib/organizations/teamLocations'

export default function LocationMultiSelect({
  value,
  onChange,
  options,
  disabled = false,
  allowCreate = true,
  placeholder = 'e.g. Odessa, Houston, Warehouse 2',
}: {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
  disabled?: boolean
  allowCreate?: boolean
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => normalizeTeamLocations(value), [value])

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const selectedSet = new Set(selected.map(s => s.toLowerCase()))
    return options.filter(opt => {
      if (selectedSet.has(opt.toLowerCase())) return false
      if (!q) return true
      return opt.toLowerCase().includes(q)
    })
  }, [options, query, selected])

  const canCreate = useMemo(() => {
    if (!allowCreate) return false
    const trimmed = query.trim()
    if (!trimmed) return false
    const lower = trimmed.toLowerCase()
    return !selected.some(s => s.toLowerCase() === lower)
      && !options.some(o => o.toLowerCase() === lower)
  }, [query, selected, options, allowCreate])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addLocation(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    if (selected.some(s => s.toLowerCase() === lower)) return
    onChange([...selected, trimmed])
    setQuery('')
    setOpen(false)
  }

  function removeLocation(loc: string) {
    onChange(selected.filter(s => s !== loc))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = query.trim().replace(/,$/, '')
      if (trimmed && allowCreate) addLocation(trimmed)
      else if (trimmed) {
        const match = options.find(opt => opt.toLowerCase() === trimmed.toLowerCase())
        if (match) addLocation(match)
      }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      onChange(selected.slice(0, -1))
    }
  }

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-2">
        {selected.length > 0 ? selected.map(loc => (
          <span
            key={loc}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-pill border border-[#E8E9EA] bg-[#F7F8F9] text-ink"
          >
            {loc}
          </span>
        )) : (
          <span className="text-sm text-ink-3">No locations assigned</span>
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`min-h-[42px] flex flex-wrap items-center gap-1.5 px-2 py-1.5 border border-[#D4D5D7] rounded-[10px] bg-white focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20 transition-colors ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {selected.map(loc => (
          <span
            key={loc}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 text-xs font-medium rounded-pill bg-[#F0F0F0] text-ink"
          >
            {loc}
            <button
              type="button"
              onClick={() => removeLocation(loc)}
              className="text-ink-3 hover:text-ink leading-none"
              aria-label={`Remove ${loc}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : 'Add location…'}
          className="flex-1 min-w-[120px] border-0 bg-transparent px-1.5 py-1 text-sm text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </div>

      {open && (filteredOptions.length > 0 || canCreate) && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-[10px] border border-[#E8E9EA] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {filteredOptions.map(opt => (
            <li key={opt}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg"
                onClick={() => addLocation(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-orange hover:bg-bg"
                onClick={() => addLocation(query.trim())}
              >
                Add &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export function LocationFieldHelper() {
  return (
    <p className="text-xs text-ink-3 mt-1.5 font-sans">
      This determines which listings they can see and manage — listings from their assigned
      location(s), plus any listings posted by an Owner.
    </p>
  )
}
