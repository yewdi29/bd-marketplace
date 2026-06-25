'use client'

import { useTransition, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

// shadcn PopoverContent class override — replaces slate defaults with our design system
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function XSmall() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Single-select popover pill ───────────────────────────────────────────────

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
        <div className="flex flex-col max-h-[320px] overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'w-full text-left px-3 py-2 rounded-[10px] text-sm font-sans transition-colors',
                opt.value === value
                  ? 'bg-[#FFF2ED] text-orange font-semibold'
                  : 'text-ink-2 hover:bg-bg hover:text-ink',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Category pill — flat when an Industry is selected, grouped when not ──────

function CategoryPill({
  value,
  options,
  industrySlug,
  onChange,
}: {
  value: string
  options: CategoryOption[]
  industrySlug: string
  onChange: (v: string) => void
}) {
  const active = !!value
  const display = active ? (options.find(o => o.slug === value)?.name ?? 'Category') : 'Category'

  const visible = industrySlug
    ? options.filter(o => o.industrySlugs.includes(industrySlug))
    : options

  // Grouped by industry when no Industry filter is active
  const groups = useMemo(() => {
    if (industrySlug) return null
    const map = new Map<string, CategoryOption[]>()
    for (const opt of visible) {
      const groupLabel = opt.industryNames[0] ?? 'Other'
      if (!map.has(groupLabel)) map.set(groupLabel, [])
      map.get(groupLabel)!.push(opt)
    }
    return map
  }, [visible, industrySlug])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={active ? PILL_ACTIVE : PILL_DEFAULT}>
          {display}
          <ChevronDown />
        </button>
      </PopoverTrigger>
      <PopoverContent className={POPOVER_CLASSES} align="start" sideOffset={8}>
        <div className="flex flex-col max-h-[360px] overflow-y-auto" style={{ width: '240px' }}>
          <button
            type="button"
            onClick={() => onChange('')}
            className={[
              'w-full text-left px-3 py-2 rounded-[10px] text-sm font-sans transition-colors',
              !value ? 'bg-[#FFF2ED] text-orange font-semibold' : 'text-ink-2 hover:bg-bg hover:text-ink',
            ].join(' ')}
          >
            All Categories
          </button>

          {groups ? (
            Array.from(groups.entries()).map(([groupLabel, opts]) => (
              <div key={groupLabel}>
                <p
                  className="font-mono uppercase text-ink-3 px-3 pt-3 pb-1"
                  style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                >
                  {groupLabel}
                </p>
                {opts.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.slug)}
                    className={[
                      'w-full text-left px-3 py-2 rounded-[10px] text-sm font-sans transition-colors',
                      opt.slug === value
                        ? 'bg-[#FFF2ED] text-orange font-semibold'
                        : 'text-ink-2 hover:bg-bg hover:text-ink',
                    ].join(' ')}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            ))
          ) : (
            visible.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.slug)}
                className={[
                  'w-full text-left px-3 py-2 rounded-[10px] text-sm font-sans transition-colors',
                  opt.slug === value
                    ? 'bg-[#FFF2ED] text-orange font-semibold'
                    : 'text-ink-2 hover:bg-bg hover:text-ink',
                ].join(' ')}
              >
                {opt.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  /** Inner content max-width — search page uses 1450px; default 1600px elsewhere. */
  maxContentWidth?: 1450 | 1600
}

export default function FilterBar({ maxContentWidth = 1600 }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [industries, setIndustries] = useState<IndustryOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [countries, setCountries]   = useState<CountryOption[]>([])

  // ── Load taxonomy reference data — public read-only tables, anon client ────
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
          const industries = (row.category_industries ?? []).flatMap(ci => ci.industries ?? [])
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            industrySlugs: industries.map(i => i.slug),
            industryNames: industries.map(i => i.name),
          }
        }))
      })
  }, [])

  // Current filter state from URL
  const industry = searchParams.get('industry') ?? ''
  const cat       = searchParams.get('cat')       ?? ''
  const country    = searchParams.get('country')    ?? ''
  const sort      = searchParams.get('sort')      ?? ''
  const q         = searchParams.get('q')         ?? ''

  // ── URL builder ─────────────────────────────────────────────────────────────

  function navigate(overrides: Partial<{
    industry: string
    cat: string
    country: string
    sort: string
    q: string
  }>) {
    const next = {
      industry,
      cat,
      country,
      sort,
      q,
      ...overrides,
    }

    // Changing Industry clears the Category selection if it no longer applies
    if ('industry' in overrides && next.cat) {
      const selected = categories.find(c => c.slug === next.cat)
      if (next.industry && selected && !selected.industrySlugs.includes(next.industry)) {
        next.cat = ''
      }
    }

    const params = new URLSearchParams()
    if (next.q)        params.set('q',        next.q)
    if (next.industry) params.set('industry', next.industry)
    if (next.cat)       params.set('cat',       next.cat)
    if (next.country)   params.set('country',   next.country)
    if (next.sort)      params.set('sort',      next.sort)
    startTransition(() => {
      router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  function clearAll() {
    startTransition(() => {
      const params = new URLSearchParams()
      if (q)    params.set('q',    q)
      if (sort) params.set('sort', sort)
      router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  // ── Active filter tag list ───────────────────────────────────────────────────

  const tags: { key: string; label: string; remove: () => void }[] = []
  if (industry)
    tags.push({ key: 'industry', label: industries.find(i => i.slug === industry)?.name ?? industry, remove: () => navigate({ industry: '' }) })
  if (cat)
    tags.push({ key: 'cat', label: categories.find(c => c.slug === cat)?.name ?? cat, remove: () => navigate({ cat: '' }) })
  if (country)
    tags.push({ key: 'country', label: countries.find(c => c.slug === country)?.name ?? country, remove: () => navigate({ country: '' }) })

  // ── Render ───────────────────────────────────────────────────────────────────

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
      <div className={`${maxContentWidth === 1450 ? 'max-w-[1450px]' : 'max-w-[1600px]'} mx-auto px-4 sm:px-6 lg:px-10`}>

        {/* ── Pills row ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 py-3">

          {/* Scrollable section: All Filters + divider + filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1 no-scrollbar pr-3">

            {/* Industry */}
            <SinglePill
              label="Industry"
              value={industry}
              options={[{ label: 'All Industries', value: '' }, ...industries.map(i => ({ label: i.name, value: i.slug }))]}
              onChange={v => navigate({ industry: v })}
            />

            {/* Category */}
            <CategoryPill
              value={cat}
              options={categories}
              industrySlug={industry}
              onChange={v => navigate({ cat: v })}
            />

            {/* Country */}
            <SinglePill
              label="Country"
              value={country}
              options={[{ label: 'All Countries', value: '' }, ...countries.map(c => ({ label: c.name, value: c.slug }))]}
              onChange={v => navigate({ country: v })}
            />

            {/* Sort */}
            <SinglePill
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onChange={v => navigate({ sort: v })}
            />
          </div>

        </div>

        {/* ── Active filter tags ─────────────────────────────────────────────── */}
        {tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 pb-3">
            {tags.map(tag => (
              <button
                key={tag.key}
                type="button"
                onClick={tag.remove}
                className="inline-flex items-center gap-1.5 px-3 h-7 bg-[#FFF2ED] text-orange border border-[#FF6B35] rounded-pill text-xs font-semibold hover:bg-orange hover:text-white hover:border-orange transition-colors"
              >
                {tag.label}
                <XSmall />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-orange hover:text-orange-lt transition-colors ml-1"
            >
              Clear All
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
