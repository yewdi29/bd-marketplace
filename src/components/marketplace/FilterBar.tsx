'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Filter options ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All Categories',  value: '' },
  { label: 'Drill Pipe',      value: 'drill_pipe' },
  { label: 'Drilling Rigs',   value: 'rig' },
  { label: 'BOP & Wellhead',  value: 'blowout_preventer' },
  { label: 'Pumping Units',   value: 'pumping_unit' },
  { label: 'Tubular Goods',   value: 'tubular_goods' },
  { label: 'Coiled Tubing',   value: 'coiled_tubing' },
  { label: 'Compressors',     value: 'compressor' },
  { label: 'Tanks & Vessels', value: 'tank' },
]

const CONDITIONS = [
  { label: 'New',        value: 'new' },
  { label: 'Like New',   value: 'like_new' },
  { label: 'Good',       value: 'good' },
  { label: 'Fair',       value: 'fair' },
  { label: 'Parts Only', value: 'parts_only' },
]

const PRICE_RANGES = [
  { label: 'All Prices',    value: '' },
  { label: 'Under $50K',    value: 'under_50k' },
  { label: '$50K–$200K',    value: '50k_200k' },
  { label: '$200K–$500K',   value: '200k_500k' },
  { label: 'Over $500K',    value: 'over_500k' },
]

const LOCATIONS = [
  { label: 'All Locations', value: '' },
  { label: 'Texas',         value: 'TX' },
  { label: 'Oklahoma',      value: 'OK' },
  { label: 'New Mexico',    value: 'NM' },
  { label: 'Louisiana',     value: 'LA' },
  { label: 'Wyoming',       value: 'WY' },
  { label: 'Colorado',      value: 'CO' },
  { label: 'North Dakota',  value: 'ND' },
]

const SORT_OPTIONS = [
  { label: 'Newest First',       value: 'created_at:desc' },
  { label: 'Price Low to High',  value: 'price:asc' },
  { label: 'Price High to Low',  value: 'price:desc' },
  { label: 'Most Viewed',        value: 'view_count:desc' },
]

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

// Checkbox override — orange checked state
const CHECKBOX_CLASSES =
  'h-4 w-4 rounded-sm border-[#D4D5D7] ring-offset-white ' +
  'focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:ring-offset-2 ' +
  'data-[state=checked]:bg-orange data-[state=checked]:border-orange data-[state=checked]:text-white'

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
        <div className="flex flex-col">
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

// ─── Multi-select popover pill (checkboxes) ───────────────────────────────────

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
  const display = active
    ? values.length === 1
      ? options.find(o => o.value === values[0])?.label ?? label
      : `${label} (${values.length})`
    : label

  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
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
        <div className="flex flex-col">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] cursor-pointer hover:bg-bg transition-colors"
            >
              <Checkbox
                checked={values.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
                className={CHECKBOX_CLASSES}
              />
              <span className={[
                'text-sm font-sans',
                values.includes(opt.value) ? 'text-ink font-medium' : 'text-ink-2',
              ].join(' ')}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Current filter state from URL
  const category   = searchParams.get('category')   ?? ''
  const conditions = (searchParams.get('conditions') ?? '').split(',').filter(Boolean)
  const priceRange = searchParams.get('priceRange')  ?? ''
  const state      = searchParams.get('state')       ?? ''
  const sort       = searchParams.get('sort')        ?? ''
  const q          = searchParams.get('q')           ?? ''


  // ── URL builder ─────────────────────────────────────────────────────────────

  function navigate(overrides: Partial<{
    category: string
    conditions: string[]
    priceRange: string
    state: string
    sort: string
    q: string
  }>) {
    const next = {
      category,
      conditions,
      priceRange,
      state,
      sort,
      q,
      ...overrides,
    }
    const params = new URLSearchParams()
    if (next.q)                    params.set('q',          next.q)
    if (next.category)             params.set('category',   next.category)
    if (next.conditions.length > 0)params.set('conditions', next.conditions.join(','))
    if (next.priceRange)           params.set('priceRange', next.priceRange)
    if (next.state)                params.set('state',      next.state)
    if (next.sort)                 params.set('sort',       next.sort)
    startTransition(() => {
      router.replace(`/listings${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  function clearAll() {
    startTransition(() => {
      const params = new URLSearchParams()
      if (q)    params.set('q',    q)
      if (sort) params.set('sort', sort)
      router.replace(`/listings${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  // ── Active filter tag list ───────────────────────────────────────────────────

  const tags: { key: string; label: string; remove: () => void }[] = []
  if (category)
    tags.push({ key: 'cat', label: CATEGORIES.find(c => c.value === category)?.label ?? category, remove: () => navigate({ category: '' }) })
  conditions.forEach(c =>
    tags.push({ key: `cond_${c}`, label: CONDITIONS.find(o => o.value === c)?.label ?? c, remove: () => navigate({ conditions: conditions.filter(x => x !== c) }) })
  )
  if (priceRange)
    tags.push({ key: 'price', label: PRICE_RANGES.find(p => p.value === priceRange)?.label ?? priceRange, remove: () => navigate({ priceRange: '' }) })
  if (state)
    tags.push({ key: 'state', label: LOCATIONS.find(l => l.value === state)?.label ?? state, remove: () => navigate({ state: '' }) })

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="sticky z-40 bg-white border-b border-[#E8E9EA]"
      style={{ top: '58px' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── Pills row ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 py-3">

          {/* Scrollable section: All Filters + divider + filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1 no-scrollbar pr-3">


            {/* Category */}
            <SinglePill
              label="Category"
              value={category}
              options={CATEGORIES}
              onChange={v => navigate({ category: v })}
            />

            {/* Condition */}
            <MultiPill
              label="Condition"
              values={conditions}
              options={CONDITIONS}
              onChange={v => navigate({ conditions: v })}
            />

            {/* Price */}
            <SinglePill
              label="Price"
              value={priceRange}
              options={PRICE_RANGES}
              onChange={v => navigate({ priceRange: v })}
            />

            {/* Location */}
            <SinglePill
              label="Location"
              value={state}
              options={LOCATIONS}
              onChange={v => navigate({ state: v })}
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
