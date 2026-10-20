import type { SupabaseClient } from '@supabase/supabase-js'
import { countryHasSubdivisions } from '@/lib/locationResolver'

export interface ListingLocationRequirementsInput {
  countryId: string | null | undefined
  stateId: string | null | undefined
  countrySlug?: string | null
  countryHasSubdivisions: boolean
}

/** Country required; state_id required only when the country has subdivisions in taxonomy. City is always optional. */
export function isListingLocationComplete(input: ListingLocationRequirementsInput): boolean {
  if (!input.countryId) return false
  if (input.countryHasSubdivisions && !input.stateId) return false
  return true
}

export function listingLocationMissingLabels(input: ListingLocationRequirementsInput): string[] {
  const missing: string[] = []
  if (!input.countryId) {
    missing.push('Country')
    return missing
  }
  if (input.countryHasSubdivisions && !input.stateId) {
    missing.push(input.countrySlug === 'canada' ? 'Province' : 'State')
  }
  return missing
}

export async function resolveCountryLocationRequirements(
  adminClient: SupabaseClient,
  countryId: string | null | undefined,
): Promise<{ countrySlug: string | null; countryHasSubdivisions: boolean }> {
  if (!countryId) {
    return { countrySlug: null, countryHasSubdivisions: false }
  }

  const { data: country } = await adminClient
    .from('countries')
    .select('slug')
    .eq('id', countryId)
    .maybeSingle()

  const countrySlug = country?.slug ?? null
  if (!countrySlug || countrySlug === 'mexico') {
    return { countrySlug, countryHasSubdivisions: false }
  }

  const { data: regions } = await adminClient
    .from('regions')
    .select('id')
    .eq('country_id', countryId)

  const regionIds = (regions ?? []).map(r => r.id)
  if (regionIds.length === 0) {
    return { countrySlug, countryHasSubdivisions: false }
  }

  const { count } = await adminClient
    .from('states')
    .select('id', { count: 'exact', head: true })
    .in('region_id', regionIds)

  const stubStates = Array.from({ length: count ?? 0 }, (_, i) => ({
    id: String(i),
    region_id: regionIds[0] ?? '',
    name: '',
    code: null,
  }))

  return {
    countrySlug,
    countryHasSubdivisions: countryHasSubdivisions(countrySlug, stubStates),
  }
}
