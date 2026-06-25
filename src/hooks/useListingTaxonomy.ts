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
  location_city: string
  location_state: string
}

export const EMPTY_TAXONOMY_VALUES: ListingTaxonomyFormValues = {
  country_id: '',
  region_id: '',
  state_id: '',
  industry_id: '',
  category_id: '',
  location_city: '',
  location_state: '',
}

export function useListingTaxonomy() {
  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState<TaxonomyCountry[]>([])
  const [regions, setRegions] = useState<TaxonomyRegion[]>([])
  const [states, setStates] = useState<TaxonomyState[]>([])
  const [industries, setIndustries] = useState<TaxonomyIndustry[]>([])
  const [categories, setCategories] = useState<TaxonomyCategory[]>([])

  useEffect(() => {
    const supabase = createClient()

    Promise.all([
      supabase.from('countries').select('id, name, slug, iso_code').order('name'),
      supabase.from('regions').select('id, country_id, name, slug').order('name'),
      supabase.from('states').select('id, region_id, name, code').order('name'),
      supabase.from('industries').select('id, name, slug, sort_order').order('sort_order'),
      supabase
        .from('categories')
        .select('id, name, slug, category_industries(industry_id)')
        .order('name'),
    ]).then(([countriesRes, regionsRes, statesRes, industriesRes, categoriesRes]) => {
      setCountries((countriesRes.data ?? []) as TaxonomyCountry[])
      setRegions((regionsRes.data ?? []) as TaxonomyRegion[])
      setStates((statesRes.data ?? []) as TaxonomyState[])

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
    industries,
    categories,
    getCountrySlug,
    regionsForCountry,
    statesForCountry,
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
  }

  if ('region_id' in patch && patch.region_id !== prev.region_id) {
    next.state_id = ''
    next.location_state = ''
  }

  if ('state_id' in patch && patch.state_id !== prev.state_id) {
    const state = taxonomy.states.find(s => s.id === next.state_id)
    next.location_state = state ? (state.code ?? state.name) : ''
  }

  if ('industry_id' in patch && patch.industry_id !== prev.industry_id) {
    const allowed = taxonomy.categoriesForIndustry(next.industry_id)
    if (next.category_id && !allowed.some(c => c.id === next.category_id)) {
      next.category_id = ''
    }
  }

  return next
}
