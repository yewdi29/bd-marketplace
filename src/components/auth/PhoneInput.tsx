'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js'
import { useFlagIconsCss } from '@/hooks/useFlagIconsCss'

const PREFERRED: CountryCode[] = ['US', 'CA', 'GB', 'MX', 'AU', 'AE', 'SA', 'NG', 'IN', 'BR']

type CountryOption = {
  code: CountryCode
  name: string
  dial: string
}

function buildCountryOptions(): CountryOption[] {
  const displayNames =
    typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames(['en'], { type: 'region' })
      : null

  const all = getCountries().map(code => ({
    code,
    name: displayNames?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
  }))

  all.sort((a, b) => a.name.localeCompare(b.name))

  const preferred = PREFERRED.map(code => all.find(c => c.code === code)).filter(
    (c): c is CountryOption => Boolean(c),
  )
  const preferredSet = new Set(preferred.map(c => c.code))
  const rest = all.filter(c => !preferredSet.has(c.code))

  return [...preferred, ...rest]
}

function composePhone(national: string, country: CountryCode): string {
  const trimmed = national.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed
  return `+${getCountryCallingCode(country)} ${trimmed}`.trim()
}

type PhoneInputProps = {
  id?: string
  /** International-ish storage string (dial + national), updated as the user types */
  value: string
  onChange: (value: string) => void
  required?: boolean
  label?: string
}

/**
 * Global phone input with country flag selector + as-you-type formatting.
 * No hard format validation — stores dial code + auto-formatted national number.
 */
export default function PhoneInput({
  id = 'phone',
  value,
  onChange,
  required = true,
  label = 'Phone Number',
}: PhoneInputProps) {
  useFlagIconsCss()

  const countries = useMemo(() => buildCountryOptions(), [])
  const [country, setCountry] = useState<CountryCode>('US')
  const [national, setNational] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const hydrated = useRef(false)

  // Keep local national display in sync if parent clears the value
  useEffect(() => {
    if (!value) {
      setNational('')
      hydrated.current = true
      return
    }
    if (!hydrated.current) {
      // Best-effort: strip leading +dial for display if parent prefilled
      const dial = `+${getCountryCallingCode(country)}`
      const stripped = value.startsWith(dial) ? value.slice(dial.length).trim() : value
      setNational(stripped)
      hydrated.current = true
    }
  }, [value, country])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selected = countries.find(c => c.code === country) ?? countries[0]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [countries, query])

  function emit(nextNational: string, nextCountry: CountryCode) {
    onChange(composePhone(nextNational, nextCountry))
  }

  function handleNationalChange(raw: string) {
    const formatted = new AsYouType(country).input(raw)
    setNational(formatted)
    emit(formatted, country)
  }

  function handleCountrySelect(next: CountryCode) {
    setCountry(next)
    setOpen(false)
    setQuery('')
    const digits = national.replace(/\D/g, '')
    const formatted = digits ? new AsYouType(next).input(digits) : ''
    setNational(formatted)
    emit(formatted, next)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={rootRef}>
      <label htmlFor={id} className="text-sm font-sans font-medium text-ink">
        {label}
        {required && <span className="text-orange ml-0.5">*</span>}
      </label>

      <div className="flex gap-2">
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Select country"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="flex h-[42px] items-center gap-1.5 rounded-[10px] border border-[#D4D5D7] bg-white px-2.5 text-sm font-sans text-ink hover:border-orange focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors"
          >
            <span
              className={`fi fi-${country.toLowerCase()} fis rounded-sm`}
              style={{ width: 20, height: 14 }}
            />
            <span className="text-ink-2">{selected.dial}</span>
            <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[280px] rounded-[12px] border border-[#E8E9EA] bg-white shadow-lg overflow-hidden">
              <div className="p-2 border-b border-[#E8E9EA]">
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search country"
                  className="w-full rounded-[8px] border border-[#D4D5D7] px-3 py-2 text-sm font-sans text-ink outline-none focus:border-orange"
                  autoFocus
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.map(c => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(c.code)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-sans hover:bg-[#F7F8F9] ${
                        c.code === country ? 'bg-[#F7F8F9] font-semibold' : ''
                      }`}
                    >
                      <span
                        className={`fi fi-${c.code.toLowerCase()} fis rounded-sm shrink-0`}
                        style={{ width: 20, height: 14 }}
                      />
                      <span className="flex-1 truncate text-ink">{c.name}</span>
                      <span className="text-ink-3 shrink-0">{c.dial}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-3 text-sm font-sans text-ink-3">No countries found</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          value={national}
          onChange={e => handleNationalChange(e.target.value)}
          placeholder="(555) 123-4567"
          className="min-w-0 flex-1 bg-white border border-[#D4D5D7] text-ink placeholder:text-ink-3 px-4 py-2.5 text-sm font-sans rounded-[10px] focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors duration-150"
        />
      </div>

      <p className="text-xs font-sans text-ink-3 leading-relaxed">
        Your privacy matters to us. This is for internal use only and is never sold or shared.
      </p>
    </div>
  )
}
