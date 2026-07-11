'use client'

import { useTransition, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'

// ─── Static filter options ──────────────────────────────────────────────────

const SORT_OPTIONS = [
  { label: 'Best Match',                      value: 'best_match' },
  { label: 'Closest to Me',                   value: 'closest' },
  { label: 'Published: Newest to Oldest',     value: 'created_at:desc' },
  { label: 'Published: Oldest to Newest',     value: 'created_at:asc' },
]

// ─── Taxonomy types — fetched from the DB on mount ────────────────────────────

interface IndustryOption { id: string; name: string; slug: string }
interface CountryOption  { id: string; name: string; slug: string }
interface CategoryOption {
  id: string
  name: string
  slug: string
  industrySlugs: string[]
  industryNames: string[]
}

// ─── Shared pill class strings ────────────────────────────────────────────────

const PILL =
  'inline-flex items-center gap-1.5 shrink-0 px-4 h-9 text-sm font-semibold rounded-pill transition-colors cursor-pointer border select-none whitespace-nowrap'
const PILL_DEFAULT = `${PILL} bg-white text-ink-2 border-[#E8E9EA] hover:border-[#D4D5D7] hover:text-ink`
const PILL_ACTIVE  = `${PILL} bg-[#FFF2ED] text-orange border-[#FF6B35]`
const PILL_CLEAR   = `${PILL} bg-[#FEF6EC] text-orange border-[#FCE4C6] hover:border-[#FF6B35] hover:bg-[#FFF2ED]`

const POPOVER_CLASSES = [
  'z-50 border border-[#E8E9EA] bg-white outline-none',
  'rounded-[16px] p-2',
  'shadow-[0_8px_28px_rgba(0,0,0,0.12)]',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2',
  'data-[side=top]:slide-in-from-bottom-2',
].join(' ')

const OPTION_ROW =
  'w-full text-left px-3 py-2 rounded-[10px] text-sm font-sans transition-colors flex items-center justify-between gap-2'
const OPTION_LIST = 'flex flex-col gap-0.5 max-h-[320px] overflow-y-auto'
const OPTION_LIST_TALL = 'flex flex-col gap-0.5 max-h-[360px] overflow-y-auto'
const OPTION_SELECTED = 'bg-[#FFF2ED] text-orange font-semibold'
const OPTION_DEFAULT = 'text-ink-2 hover:bg-bg hover:text-ink'

// ─── URL helpers ──────────────────────────────────────────────────────────────

function parseMultiParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key)
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function joinMultiParam(values: string[]): string {
  return values.join(',')
}

function pillLabel(label: string, values: string[], options: { label: string; value: string }[]): string {
  if (values.length === 0) return label
  if (values.length === 1) {
    return options.find(o => o.value === values[0])?.label ?? label
  }
  return `${label} (${values.length})`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Multi-select popover pill ────────────────────────────────────────────────

function MultiPill({
  label,
  values,
  options,
  onChange,
}: {
  label: string
  values: string[]
  options: { label: string; value: string }[]
  onChange: (v: string[]) => void
}) {
  const active = values.length > 0
  const display = pillLabel(label, values, options)

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value))
    } else {
      onChange([...values, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={active ? PILL_ACTIVE : PILL_DEFAULT}>
          {display}
          <ChevronDown />
        </button>
      </PopoverTrigger>
      <PopoverContent className={POPOVER_CLASSES} align="start" sideOffset={8}>
        <div className={OPTION_LIST}>
          {options.map(opt => {
            const selected = values.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={[OPTION_ROW, selected ? OPTION_SELECTED : OPTION_DEFAULT].join(' ')}
              >
                <span>{opt.label}</span>
                {selected && <CheckMark />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Single-select popover pill (sort — click again to deselect) ──────────────

function SinglePill({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  const active = !!value
  const display = active ? (options.find(o => o.value === value)?.label ?? label) : label

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={active ? PILL_ACTIVE : PILL_DEFAULT}>
          {display}
          <ChevronDown />
        </button>
      </PopoverTrigger>
      <PopoverContent className={POPOVER_CLASSES} align="start" sideOffset={8}>
        <div className={OPTION_LIST}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value === value ? '' : opt.value)}
              className={[
                OPTION_ROW,
                opt.value === value ? OPTION_SELECTED : OPTION_DEFAULT,
              ].join(' ')}
            >
              <span>{opt.label}</span>
              {opt.value === value && <CheckMark />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Category pill — union of categories when multiple industries selected ─────

function CategoryPill({
  values,
  options,
  industries,
  industrySlugs,
  onChange,
}: {
  values: string[]
  options: CategoryOption[]
  industries: IndustryOption[]
  industrySlugs: string[]
  onChange: (v: string[]) => void
}) {
  const active = values.length > 0
  const flatOptions = useMemo(
    () => options.map(o => ({ label: o.name, value: o.slug })),
    [options],
  )
  const display = pillLabel('Category', values, flatOptions)

  const groups = useMemo(() => {
    const map = new Map<string, CategoryOption[]>()

    if (industrySlugs.length > 0) {
      for (const slug of industrySlugs) {
        const label = industries.find(i => i.slug === slug)?.name ?? slug
        const opts = options.filter(o => o.industrySlugs.includes(slug))
        if (opts.length > 0) map.set(label, opts)
      }
      return map
    }

    for (const opt of options) {
      const groupLabel = opt.industryNames[0] ?? 'Other'
      if (!map.has(groupLabel)) map.set(groupLabel, [])
      map.get(groupLabel)!.push(opt)
    }
    return map
  }, [options, industries, industrySlugs])

  function toggle(slug: string) {
    if (values.includes(slug)) {
      onChange(values.filter(v => v !== slug))
    } else {
      onChange([...values, slug])
    }
  }

  function renderOption(opt: CategoryOption) {
    const selected = values.includes(opt.slug)
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => toggle(opt.slug)}
        className={[OPTION_ROW, selected ? OPTION_SELECTED : OPTION_DEFAULT].join(' ')}
      >
        <span>{opt.name}</span>
        {selected && <CheckMark />}
      </button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={active ? PILL_ACTIVE : PILL_DEFAULT}>
          {display}
          <ChevronDown />
        </button>
      </PopoverTrigger>
      <PopoverContent className={POPOVER_CLASSES} align="start" sideOffset={8}>
        <div className={`${OPTION_LIST_TALL}`} style={{ width: '240px' }}>
          {Array.from(groups.entries()).map(([groupLabel, opts]) => (
            <div key={groupLabel} className="flex flex-col gap-0.5">
              <p
                className="font-mono uppercase text-ink-3 px-3 pt-3 pb-1"
                style={{ fontSize: '10px', letterSpacing: '0.08em' }}
              >
                {groupLabel}
              </p>
              {opts.map(renderOption)}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  maxContentWidth?: 1450 | 1600
  /** Show "Clear all" when filters are active — search page only */
  showClearAll?: boolean
}

export default function FilterBar({ maxContentWidth = 1600, showClearAll = false }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [industries, setIndustries] = useState<IndustryOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [countries, setCountries]   = useState<CountryOption[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase.from('industries').select('id, name, slug').order('sort_order')
      .then(({ data }) => setIndustries(data ?? []))

    supabase.from('countries').select('id, name, slug')
      .then(({ data }) => setCountries(data ?? []))

    supabase
      .from('categories')
      .select('id, name, slug, category_industries(industries(slug, name))')
      .order('name')
      .then(({ data }) => {
        type Row = {
          id: string
          name: string
          slug: string
          category_industries: { industries: { slug: string; name: string }[] }[] | null
        }
        const rows = (data ?? []) as unknown as Row[]
        setCategories(rows.map(row => {
          const linked = (row.category_industries ?? []).flatMap(ci => ci.industries ?? [])
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            industrySlugs: linked.map(i => i.slug),
            industryNames: linked.map(i => i.name),
          }
        }))
      })
  }, [])

  const industrySlugs = parseMultiParam(searchParams, 'industry')
  const catSlugs      = parseMultiParam(searchParams, 'cat')
  const countrySlugs  = parseMultiParam(searchParams, 'country')
  const sort          = searchParams.get('sort') ?? ''
  const q             = searchParams.get('q') ?? ''

  const hasActiveFilters =
    industrySlugs.length > 0
    || catSlugs.length > 0
    || countrySlugs.length > 0
    || !!sort

  function clearAllFilters() {
    navigate({ industry: [], cat: [], country: [], sort: '' })
  }

  function pruneCategories(nextIndustrySlugs: string[], nextCatSlugs: string[]): string[] {
    if (nextIndustrySlugs.length === 0) return nextCatSlugs
    return nextCatSlugs.filter(slug => {
      const cat = categories.find(c => c.slug === slug)
      return cat && cat.industrySlugs.some(is => nextIndustrySlugs.includes(is))
    })
  }

  function navigate(overrides: Partial<{
    industry: string[]
    cat: string[]
    country: string[]
    sort: string
    q: string
  }>) {
    const nextIndustry = overrides.industry ?? industrySlugs
    let nextCat = overrides.cat ?? catSlugs
    const nextCountry = overrides.country ?? countrySlugs
    const nextSort = overrides.sort ?? sort
    const nextQ = overrides.q ?? q

    if ('industry' in overrides && !('cat' in overrides)) {
      nextCat = pruneCategories(nextIndustry, nextCat)
    }

    const params = new URLSearchParams()
    if (nextQ) params.set('q', nextQ)
    const industryParam = joinMultiParam(nextIndustry)
    if (industryParam) params.set('industry', industryParam)
    const catParam = joinMultiParam(nextCat)
    if (catParam) params.set('cat', catParam)
    const countryParam = joinMultiParam(nextCountry)
    if (countryParam) params.set('country', countryParam)
    if (nextSort) params.set('sort', nextSort)

    startTransition(() => {
      const base = pathname.startsWith('/search') || pathname.startsWith('/listings')
        ? pathname
        : '/search'
      router.replace(`${base}${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  return (
    <div
      className="sticky z-40 border-b"
      style={{
        top: '58px',
        background: 'rgba(255,255,255,0.20)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(232,233,234,0.25)',
      }}
    >
      <div className={`${maxContentWidth === 1450 ? 'page-shell' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10'}`}>
        <div className="flex items-center gap-0 py-3">
          <div className="flex items-center gap-2 overflow-x-auto flex-1 no-scrollbar pr-3">
            <MultiPill
              label="Industry"
              values={industrySlugs}
              options={industries.map(i => ({ label: i.name, value: i.slug }))}
              onChange={v => navigate({ industry: v })}
            />

            <CategoryPill
              values={catSlugs}
              options={categories}
              industries={industries}
              industrySlugs={industrySlugs}
              onChange={v => navigate({ cat: v })}
            />

            <MultiPill
              label="Country"
              values={countrySlugs}
              options={countries.map(c => ({ label: c.name, value: c.slug }))}
              onChange={v => navigate({ country: v })}
            />

            <SinglePill
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onChange={v => navigate({ sort: v })}
            />

            {showClearAll && hasActiveFilters && (
              <button
                type="button"
                className={PILL_CLEAR}
                onClick={clearAllFilters}
              >
                <ClearIcon />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
