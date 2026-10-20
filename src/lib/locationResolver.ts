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
  city_id: string | null
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

interface CityRow {
  id: string
  state_id: string
  name: string
  slug: string
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
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
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

async function loadAllCities(client: LocationLookupClient): Promise<CityRow[]> {
  const pageSize = 1000
  const rows: CityRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await client
      .from('cities')
      .select('id, state_id, name, slug')
      .range(from, from + pageSize - 1)
    if (error) break
    const page = (data ?? []) as CityRow[]
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }
  return rows
}

export async function loadLocationTaxonomy(client: LocationLookupClient): Promise<{
  countries: CountryRow[]
  regions: RegionRow[]
  states: StateRow[]
  cities: CityRow[]
}> {
  const [{ data: countries }, { data: regions }, { data: states }, cities] = await Promise.all([
    client.from('countries').select('id, slug, name'),
    client.from('regions').select('id, country_id, slug, name'),
    client.from('states').select('id, region_id, name, code'),
    loadAllCities(client),
  ])

  return {
    countries: (countries ?? []) as CountryRow[],
    regions: (regions ?? []) as RegionRow[],
    states: (states ?? []) as StateRow[],
    cities,
  }
}

function matchCity(cities: CityRow[], stateId: string, cityText: string | null | undefined): CityRow | null {
  const raw = cityText?.trim()
  if (!raw || !stateId) return null
  const norm = normalizeText(raw)
  const inState = cities.filter(c => c.state_id === stateId)
  return (
    inState.find(c => normalizeText(c.name) === norm)
    ?? inState.find(c => c.slug === norm.replace(/\s+/g, '-'))
    ?? null
  )
}

export function resolveLocationFromTaxonomy(
  taxonomy: { countries: CountryRow[]; regions: RegionRow[]; states: StateRow[]; cities?: CityRow[] },
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
    city_id: null,
    location_city: input.location_city?.trim() || null,
    location_state: input.location_state?.trim() || null,
  }

  const countrySlug = resolveCountrySlug(input.country_slug)
  if (!countrySlug) return empty

  const country = taxonomy.countries.find(c => c.slug === countrySlug)
  if (!country) return empty

  const countryRegions = taxonomy.regions.filter(r => r.country_id === country.id)
  const countryStates = taxonomy.states.filter(s =>
    countryRegions.some(r => r.id === s.region_id)
  )

  let cityText = input.location_city?.trim() || null
  let matchedState = matchState(countryStates, input.location_state, null)
  if (!matchedState && cityText) {
    const norm = normalizeText(cityText)
    const exactState = countryStates.find(s =>
      normalizeText(s.name) === norm
      || (s.code != null && s.code.toUpperCase() === cityText!.toUpperCase())
    )
    if (exactState) {
      matchedState = exactState
      cityText = null
    }
  }
  if (!matchedState) {
    return {
      ...empty,
      country_id: country.id,
      location_state: input.location_state?.trim() || null,
    }
  }

  const region = taxonomy.regions.find(r => r.id === matchedState.region_id) ?? null
  const matchedCity = matchCity(taxonomy.cities ?? [], matchedState.id, cityText)

  return {
    country_id: country.id,
    region_id: region?.id ?? null,
    state_id: matchedState.id,
    city_id: matchedCity?.id ?? null,
    location_city: matchedCity?.name ?? cityText,
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
  taxonomy: { countries: CountryRow[]; regions: RegionRow[]; states: StateRow[]; cities?: CityRow[] },
  input: {
    country_id?: string | null
    region_id?: string | null
    state_id?: string | null
    city_id?: string | null
    location_city?: string | null
  },
): ResolvedLocation {
  const country = taxonomy.countries.find(c => c.id === input.country_id) ?? null
  if (!country) {
    return {
      country_id: null,
      region_id: null,
      state_id: null,
      city_id: null,
      location_city: input.location_city?.trim() || null,
      location_state: null,
    }
  }

  const state = taxonomy.states.find(s => s.id === input.state_id) ?? null
  const region = state
    ? taxonomy.regions.find(r => r.id === state.region_id) ?? null
    : taxonomy.regions.find(r => r.id === input.region_id && r.country_id === country.id) ?? null

  const cities = taxonomy.cities ?? []
  let city: CityRow | null = null
  if (input.city_id && input.city_id !== 'other') {
    city = cities.find(c => c.id === input.city_id && (!state || c.state_id === state.id)) ?? null
  } else if (input.city_id !== 'other' && state) {
    city = matchCity(cities, state.id, input.location_city)
  }

  return {
    country_id: country.id,
    region_id: region?.id ?? null,
    state_id: state?.id ?? null,
    city_id: city?.id ?? null,
    location_city: city?.name ?? (input.location_city?.trim() || null),
    location_state: state ? (state.code ?? state.name) : null,
  }
}

export function countryHasSubdivisions(
  _countrySlug: string | null | undefined,
  statesForCountry: StateRow[],
): boolean {
  return statesForCountry.length > 0
}

export function countryUsesRegionStep(countrySlug: string | null | undefined): boolean {
  return countrySlug === 'united-states'
}
