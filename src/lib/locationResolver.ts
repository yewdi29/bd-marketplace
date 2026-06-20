// Resolves listing location FK fields from AI output or form text.
// Matches city/state/province mentions against the countries → regions → states taxonomy.

export interface LocationLookupClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export interface ResolvedLocation {
  country_id: string | null
  region_id: string | null
  state_id: string | null
  location_city: string | null
  location_state: string | null
}

interface CountryRow { id: string; slug: string; name: string }
interface RegionRow { id: string; country_id: string; slug: string; name: string }
interface StateRow {
  id: string
  region_id: string
  name: string
  code: string | null
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: 'united-states',
  usa: 'united-states',
  'united states': 'united-states',
  'united states of america': 'united-states',
  ca: 'canada',
  mx: 'mexico',
  méxico: 'mexico',
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
}

function resolveCountrySlug(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (COUNTRY_ALIASES[trimmed]) return COUNTRY_ALIASES[trimmed]
  return normalizeSlug(trimmed)
}

function matchState(
  states: StateRow[],
  stateText: string | null | undefined,
  cityText: string | null | undefined,
): StateRow | null {
  const candidates = [stateText, cityText].filter(Boolean) as string[]
  if (candidates.length === 0) return null

  for (const raw of candidates) {
    const norm = normalizeText(raw)
    const upper = raw.trim().toUpperCase()

    const byCode = states.find(s => s.code && s.code.toUpperCase() === upper)
    if (byCode) return byCode

    const byName = states.find(s => normalizeText(s.name) === norm)
    if (byName) return byName

    // Partial match — e.g. "Newfoundland" in "Newfoundland and Labrador"
    const byPartial = states.find(s => {
      const stateNorm = normalizeText(s.name)
      return stateNorm.includes(norm) || norm.includes(stateNorm)
    })
    if (byPartial) return byPartial
  }

  return null
}

export async function loadLocationTaxonomy(client: LocationLookupClient): Promise<{
  countries: CountryRow[]
  regions: RegionRow[]
  states: StateRow[]
}> {
  const [{ data: countries }, { data: regions }, { data: states }] = await Promise.all([
    client.from('countries').select('id, slug, name'),
    client.from('regions').select('id, country_id, slug, name'),
    client.from('states').select('id, region_id, name, code'),
  ])

  return {
    countries: (countries ?? []) as CountryRow[],
    regions: (regions ?? []) as RegionRow[],
    states: (states ?? []) as StateRow[],
  }
}

export function resolveLocationFromTaxonomy(
  taxonomy: { countries: CountryRow[]; regions: RegionRow[]; states: StateRow[] },
  input: {
    country_slug?: string | null
    location_city?: string | null
    location_state?: string | null
  },
): ResolvedLocation {
  const empty: ResolvedLocation = {
    country_id: null,
    region_id: null,
    state_id: null,
    location_city: input.location_city?.trim() || null,
    location_state: input.location_state?.trim() || null,
  }

  const countrySlug = resolveCountrySlug(input.country_slug)
  if (!countrySlug) return empty

  const country = taxonomy.countries.find(c => c.slug === countrySlug)
  if (!country) return empty

  // Mexico — country alone is a complete location
  if (countrySlug === 'mexico') {
    return {
      country_id: country.id,
      region_id: null,
      state_id: null,
      location_city: input.location_city?.trim() || null,
      location_state: null,
    }
  }

  const countryRegions = taxonomy.regions.filter(r => r.country_id === country.id)
  const countryStates = taxonomy.states.filter(s =>
    countryRegions.some(r => r.id === s.region_id)
  )

  const matchedState = matchState(countryStates, input.location_state, input.location_city)
  if (!matchedState) {
    return {
      ...empty,
      country_id: country.id,
      location_state: input.location_state?.trim() || null,
    }
  }

  const region = taxonomy.regions.find(r => r.id === matchedState.region_id) ?? null

  return {
    country_id: country.id,
    region_id: region?.id ?? null,
    state_id: matchedState.id,
    location_city: input.location_city?.trim() || null,
    location_state: matchedState.code ?? matchedState.name,
  }
}

export async function resolveLocationIds(
  client: LocationLookupClient,
  input: {
    country_slug?: string | null
    location_city?: string | null
    location_state?: string | null
  },
): Promise<ResolvedLocation> {
  const taxonomy = await loadLocationTaxonomy(client)
  return resolveLocationFromTaxonomy(taxonomy, input)
}

/** Sync FK fields when the seller picks IDs directly in the form. */
export function resolveLocationFromIds(
  taxonomy: { countries: CountryRow[]; regions: RegionRow[]; states: StateRow[] },
  input: {
    country_id?: string | null
    region_id?: string | null
    state_id?: string | null
    location_city?: string | null
  },
): ResolvedLocation {
  const country = taxonomy.countries.find(c => c.id === input.country_id) ?? null
  if (!country) {
    return {
      country_id: null,
      region_id: null,
      state_id: null,
      location_city: input.location_city?.trim() || null,
      location_state: null,
    }
  }

  if (country.slug === 'mexico') {
    return {
      country_id: country.id,
      region_id: null,
      state_id: null,
      location_city: input.location_city?.trim() || null,
      location_state: null,
    }
  }

  const state = taxonomy.states.find(s => s.id === input.state_id) ?? null
  const region = state
    ? taxonomy.regions.find(r => r.id === state.region_id) ?? null
    : taxonomy.regions.find(r => r.id === input.region_id && r.country_id === country.id) ?? null

  return {
    country_id: country.id,
    region_id: region?.id ?? null,
    state_id: state?.id ?? null,
    location_city: input.location_city?.trim() || null,
    location_state: state ? (state.code ?? state.name) : null,
  }
}

export function countryHasSubdivisions(
  countrySlug: string | null | undefined,
  statesForCountry: StateRow[],
): boolean {
  if (!countrySlug || countrySlug === 'mexico') return false
  return statesForCountry.length > 0
}

export function countryUsesRegionStep(countrySlug: string | null | undefined): boolean {
  return countrySlug === 'united-states'
}
