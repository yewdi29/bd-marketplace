'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  countryHasSubdivisions,
  countryUsesRegionStep,
} from '@/lib/locationResolver'

export interface TaxonomyCountry {
  id: string
  name: string
  slug: string
  iso_code: string | null
}

export interface TaxonomyRegion {
  id: string
  country_id: string
  name: string
  slug: string
}

export interface TaxonomyState {
  id: string
  region_id: string
  name: string
  code: string | null
}

export interface TaxonomyCity {
  id: string
  state_id: string
  name: string
  slug: string
  sort_order: number
}

export interface TaxonomyIndustry {
  id: string
  name: string
  slug: string
  sort_order: number
}

export interface TaxonomyCategory {
  id: string
  name: string
  slug: string
  industryIds: string[]
}

export interface ListingTaxonomyFormValues {
  country_id: string
  region_id: string
  state_id: string
  industry_id: string
  category_id: string
  city_id: string
  location_city: string
  location_state: string
}

export const EMPTY_TAXONOMY_VALUES: ListingTaxonomyFormValues = {
  country_id: '',
  region_id: '',
  state_id: '',
  industry_id: '',
  category_id: '',
  city_id: '',
  location_city: '',
  location_state: '',
}

export function useListingTaxonomy() {
  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState<TaxonomyCountry[]>([])
  const [regions, setRegions] = useState<TaxonomyRegion[]>([])
  const [states, setStates] = useState<TaxonomyState[]>([])
  const [cities, setCities] = useState<TaxonomyCity[]>([])
  const [industries, setIndustries] = useState<TaxonomyIndustry[]>([])
  const [categories, setCategories] = useState<TaxonomyCategory[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function loadCities(): Promise<TaxonomyCity[]> {
      const pageSize = 1000
      const rows: TaxonomyCity[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from('cities')
          .select('id, state_id, name, slug, sort_order')
          .order('name')
          .range(from, from + pageSize - 1)
        if (error) break
        const page = (data ?? []) as TaxonomyCity[]
        rows.push(...page)
        if (page.length < pageSize) break
        from += pageSize
      }
      return rows
    }

    Promise.all([
      supabase.from('countries').select('id, name, slug, iso_code').order('name'),
      supabase.from('regions').select('id, country_id, name, slug').order('name'),
      supabase.from('states').select('id, region_id, name, code').order('name'),
      loadCities(),
      supabase.from('industries').select('id, name, slug, sort_order').order('sort_order'),
      supabase
        .from('categories')
        .select('id, name, slug, category_industries(industry_id)')
        .order('name'),
    ]).then(([countriesRes, regionsRes, statesRes, cityRows, industriesRes, categoriesRes]) => {
      setCountries((countriesRes.data ?? []) as TaxonomyCountry[])
      setRegions((regionsRes.data ?? []) as TaxonomyRegion[])
      setStates((statesRes.data ?? []) as TaxonomyState[])
      setCities(cityRows)

      setIndustries((industriesRes.data ?? []) as TaxonomyIndustry[])

      type CatRow = {
        id: string
        name: string
        slug: string
        category_industries: { industry_id: string }[] | null
      }
      setCategories(
        ((categoriesRes.data ?? []) as CatRow[]).map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          industryIds: (row.category_industries ?? []).map(ci => ci.industry_id),
        }))
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function getCountrySlug(countryId: string): string | null {
    return countries.find(c => c.id === countryId)?.slug ?? null
  }

  function regionsForCountry(countryId: string): TaxonomyRegion[] {
    return regions.filter(r => r.country_id === countryId)
  }

  function statesForCountry(countryId: string): TaxonomyState[] {
    const regionIds = new Set(regionsForCountry(countryId).map(r => r.id))
    return states.filter(s => regionIds.has(s.region_id))
  }

  function citiesForState(stateId: string): TaxonomyCity[] {
    if (!stateId) return []
    return cities
      .filter(c => c.state_id === stateId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  function statesForRegion(regionId: string): TaxonomyState[] {
    return states.filter(s => s.region_id === regionId)
  }

  function categoriesForIndustry(industryId: string): TaxonomyCategory[] {
    if (!industryId) return []
    return categories.filter(c => c.industryIds.includes(industryId))
  }

  function needsRegionStep(countryId: string): boolean {
    const slug = getCountrySlug(countryId)
    return countryUsesRegionStep(slug)
  }

  function needsSubdivisionStep(countryId: string): boolean {
    const slug = getCountrySlug(countryId)
    return countryHasSubdivisions(slug, statesForCountry(countryId))
  }

  function subdivisionLabel(countryId: string): string {
    const slug = getCountrySlug(countryId)
    return slug === 'canada' ? 'Province' : 'State'
  }

  return {
    loading,
    countries,
    regions,
    states,
    cities,
    industries,
    categories,
    getCountrySlug,
    regionsForCountry,
    statesForCountry,
    citiesForState,
    statesForRegion,
    categoriesForIndustry,
    needsRegionStep,
    needsSubdivisionStep,
    subdivisionLabel,
  }
}

/** Apply cascading clears when a parent taxonomy field changes. */
export function applyTaxonomyChange(
  prev: ListingTaxonomyFormValues,
  patch: Partial<ListingTaxonomyFormValues>,
  taxonomy: ReturnType<typeof useListingTaxonomy>,
): ListingTaxonomyFormValues {
  const next = { ...prev, ...patch }

  if ('country_id' in patch && patch.country_id !== prev.country_id) {
    next.region_id = ''
    next.state_id = ''
    next.location_state = ''
    next.city_id = ''
    next.location_city = ''
  }

  if ('region_id' in patch && patch.region_id !== prev.region_id) {
    next.state_id = ''
    next.location_state = ''
    next.city_id = ''
    next.location_city = ''
  }

  if ('state_id' in patch && patch.state_id !== prev.state_id) {
    const state = taxonomy.states.find(s => s.id === next.state_id)
    next.location_state = state ? (state.code ?? state.name) : ''
    // Region is not user-editable — derive it from the selected state.
    next.region_id = state?.region_id ?? ''
    next.city_id = ''
    next.location_city = ''
  }

  if ('city_id' in patch && patch.city_id !== prev.city_id) {
    if (!next.city_id || next.city_id === 'other') {
      next.location_city = next.city_id === 'other' ? '' : next.location_city
    } else {
      const city = taxonomy.cities.find(c => c.id === next.city_id)
      next.location_city = city?.name ?? ''
    }
  }

  if ('industry_id' in patch && patch.industry_id !== prev.industry_id) {
    const allowed = taxonomy.categoriesForIndustry(next.industry_id)
    if (next.category_id && !allowed.some(c => c.id === next.category_id)) {
      next.category_id = ''
    }
  }

  return next
}
