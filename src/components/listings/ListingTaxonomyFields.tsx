'use client'

import {
  useListingTaxonomy,
  applyTaxonomyChange,
  type ListingTaxonomyFormValues,
} from '@/hooks/useListingTaxonomy'

const selectCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors appearance-none cursor-pointer'

const inputCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors placeholder:text-ink-3'

const labelCls = 'block text-sm font-semibold text-ink mb-1.5'

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative [&>select]:pr-10">
      {children}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-[#CC0000]">*</span>}
      </label>
      {children}
    </div>
  )
}

interface Props {
  values: ListingTaxonomyFormValues
  onChange: (values: ListingTaxonomyFormValues) => void
  required?: boolean
}

export default function ListingTaxonomyFields({ values, onChange, required = false }: Props) {
  const taxonomy = useListingTaxonomy()

  function update(patch: Partial<ListingTaxonomyFormValues>) {
    onChange(applyTaxonomyChange(values, patch, taxonomy))
  }

  if (taxonomy.loading) {
    return (
      <p className="text-sm text-ink-3 py-2">Loading form options…</p>
    )
  }

  const countrySlug = taxonomy.getCountrySlug(values.country_id)
  const showRegion = values.country_id && taxonomy.needsRegionStep(values.country_id)
  const showSubdivision = values.country_id && taxonomy.needsSubdivisionStep(values.country_id)
  const subdivisionOptions = showRegion && values.region_id
    ? taxonomy.statesForRegion(values.region_id)
    : showSubdivision
      ? taxonomy.statesForCountry(values.country_id)
      : []
  const categoryOptions = taxonomy.categoriesForIndustry(values.industry_id)

  return (
    <div className="space-y-4">
      {/* Industry + Category */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Industry" required={required}>
          <SelectWrapper>
            <select
              value={values.industry_id}
              onChange={e => update({ industry_id: e.target.value })}
              className={selectCls}
            >
              <option value="">Select industry</option>
              {taxonomy.industries.map(ind => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
              ))}
            </select>
          </SelectWrapper>
        </FormField>

        <FormField label="Category" required={required}>
          <SelectWrapper>
            <select
              value={values.category_id}
              onChange={e => update({ category_id: e.target.value })}
              className={selectCls}
              disabled={!values.industry_id}
            >
              <option value="">
                {values.industry_id ? 'Select category' : 'Select industry first'}
              </option>
              {categoryOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </SelectWrapper>
        </FormField>
      </div>

      {/* Country */}
      <FormField label="Country" required={required}>
        <SelectWrapper>
          <select
            value={values.country_id}
            onChange={e => update({ country_id: e.target.value })}
            className={selectCls}
          >
            <option value="">Select country</option>
            {taxonomy.countries.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </SelectWrapper>
      </FormField>

      {/* US Region */}
      {showRegion && (
        <FormField label="Region" required={required}>
          <SelectWrapper>
            <select
              value={values.region_id}
              onChange={e => update({ region_id: e.target.value })}
              className={selectCls}
            >
              <option value="">Select region</option>
              {taxonomy.regionsForCountry(values.country_id).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </SelectWrapper>
        </FormField>
      )}

      {/* City + State/Province */}
      <div className={showSubdivision ? 'grid grid-cols-2 gap-4' : ''}>
        <FormField label="City" required={required && countrySlug !== 'mexico'}>
          <input
            type="text"
            value={values.location_city}
            onChange={e => update({ location_city: e.target.value })}
            className={inputCls}
            placeholder={countrySlug === 'mexico' ? 'Optional' : 'e.g. Midland'}
          />
        </FormField>

        {showSubdivision && (
          <FormField label={taxonomy.subdivisionLabel(values.country_id)} required={required}>
            <SelectWrapper>
              <select
                value={values.state_id}
                onChange={e => update({ state_id: e.target.value })}
                className={selectCls}
                disabled={!!(showRegion && !values.region_id)}
              >
                <option value="">
                  {showRegion && !values.region_id
                    ? 'Select region first'
                    : `Select ${taxonomy.subdivisionLabel(values.country_id).toLowerCase()}`}
                </option>
                {subdivisionOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </SelectWrapper>
          </FormField>
        )}
      </div>

      {countrySlug === 'mexico' && values.country_id && (
        <p className="text-xs text-ink-3 -mt-2">
          Mexico is saved as the full location — no state or province required.
        </p>
      )}
    </div>
  )
}

export { inputCls, selectCls, labelCls, SelectWrapper, FormField }
