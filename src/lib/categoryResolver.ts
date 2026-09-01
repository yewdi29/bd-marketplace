// Resolves a listing's category_id/industry_id from its title and legacy
// `category` text. Title keywords take priority over the legacy category —
// the legacy field is coarse (e.g. "rental_tools" covers everything from
// pipe racks to fishing tools), while the title usually names the actual
// equipment. Falls back to the legacy category only when no title keyword
// matches.

const TITLE_KEYWORD_RULES: { pattern: RegExp; categoryName: string }[] = [
  { pattern: /pipe rack|pipe stacker/i, categoryName: 'Pipe Racks' },
  { pattern: /drill pipe|drill collar|tubular/i, categoryName: 'Drill Pipe & Tubulars' },
  { pattern: /coiled tubing|coil tubing/i, categoryName: 'Coiled Tubing Equipment' },
  { pattern: /workover rig|well service rig/i, categoryName: 'Workover & Well Service Rigs' },
  // Parts/components before the broad "drilling rig" rule so brake bands,
  // drawworks, masts, etc. do not land under complete Drilling Rigs.
  {
    pattern:
      /brake band|drawworks|top drive|traveling block|crown block|rotary table|\bmast\b|rig engine|drilling rig parts?/i,
    categoryName: 'Drilling Rig Parts',
  },
  { pattern: /drilling rig/i, categoryName: 'Drilling Rigs' },
  { pattern: /blowout preventer|\bbop\b|wellhead|christmas tree/i, categoryName: 'Wellhead Equipment' },
  { pattern: /mud pump|pump jack|pumping unit/i, categoryName: 'Pumps & Pump Jacks' },
  { pattern: /separator|\btank\b/i, categoryName: 'Separators & Tanks' },
  { pattern: /compressor/i, categoryName: 'Compressors' },
  { pattern: /drill bit/i, categoryName: 'Drill Bits' },
]

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  drilling_rig: 'Drilling Rigs',
  drilling_rigs: 'Drilling Rigs',
  rig: 'Drilling Rigs',
  drilling_rig_parts: 'Drilling Rig Parts',
  drill_pipe: 'Drill Pipe & Tubulars',
  drill_collar: 'Drill Pipe & Tubulars',
  tubular_goods: 'Drill Pipe & Tubulars',
  drill_pipe_tubulars: 'Drill Pipe & Tubulars',
  blowout_preventer: 'Wellhead Equipment',
  wellhead: 'Wellhead Equipment',
  wellhead_equipment: 'Wellhead Equipment',
  completion_equipment: 'Wellhead Equipment',
  pumping_unit: 'Pumps & Pump Jacks',
  mud_pump: 'Pumps & Pump Jacks',
  artificial_lift: 'Pumps & Pump Jacks',
  pumps_pump_jacks: 'Pumps & Pump Jacks',
  coiled_tubing: 'Coiled Tubing Equipment',
  coiled_tubing_equipment: 'Coiled Tubing Equipment',
  compressor: 'Compressors',
  compressors: 'Compressors',
  separator: 'Separators & Tanks',
  tank: 'Separators & Tanks',
  separators_tanks: 'Separators & Tanks',
  production_equipment: 'Separators & Tanks',
  wireline: 'Fishing & Rental Tools',
  rental_tools: 'Fishing & Rental Tools',
  fishing_rental_tools: 'Fishing & Rental Tools',
  workover_well_service_rigs: 'Workover & Well Service Rigs',
  pipe_racks: 'Pipe Racks',
  drill_bits: 'Drill Bits',
  // Taxonomy slugs (hyphen form → same labels)
  'drilling-rigs': 'Drilling Rigs',
  'drilling-rig-parts': 'Drilling Rig Parts',
  'drill-pipe-tubulars': 'Drill Pipe & Tubulars',
  'coiled-tubing-equipment': 'Coiled Tubing Equipment',
  'workover-well-service-rigs': 'Workover & Well Service Rigs',
  'pumps-pump-jacks': 'Pumps & Pump Jacks',
  'separators-tanks': 'Separators & Tanks',
  'wellhead-equipment': 'Wellhead Equipment',
  'pipe-racks': 'Pipe Racks',
  'fishing-rental-tools': 'Fishing & Rental Tools',
  'drill-bits': 'Drill Bits',
  'hay-forage-equipment': 'Hay & Forage Equipment',
  'chippers-grinders': 'Chippers & Grinders',
  'loaders-shovels': 'Loaders & Shovels',
  'drills-surface-underground': 'Drills (Surface & Underground)',
  'conveyors-feeders': 'Conveyors & Feeders',
  'screens-vibrating-equipment': 'Screens & Vibrating Equipment',
  'aerial-lifts-telehandlers': 'Aerial Lifts & Telehandlers',
  'asphalt-paving-equipment': 'Asphalt & Paving Equipment',
}

/**
 * Public-facing category label for cards / UI.
 * Prefers taxonomy `categories.name` (keeps ampersands), then legacy/slug maps.
 */
export function formatListingCategoryLabel(
  legacyOrSlug: string | null | undefined,
  taxonomyName?: string | null,
): string {
  const fromTaxonomy = taxonomyName?.trim()
  if (fromTaxonomy) return fromTaxonomy

  const raw = legacyOrSlug?.trim()
  if (!raw) return ''

  if (LEGACY_CATEGORY_MAP[raw]) return LEGACY_CATEGORY_MAP[raw]

  const underscored = raw.replace(/-/g, '_')
  if (LEGACY_CATEGORY_MAP[underscored]) return LEGACY_CATEGORY_MAP[underscored]

  const hyphenated = raw.replace(/_/g, '-')
  if (LEGACY_CATEGORY_MAP[hyphenated]) return LEGACY_CATEGORY_MAP[hyphenated]

  // Humanize leftover slugs; restore common "&" joins lost by underscore conversion
  return raw
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bAnd\b/g, '&')
}

export function resolveCategoryName(
  title: string | null | undefined,
  legacyCategory: string | null | undefined
): string | null {
  if (title) {
    for (const rule of TITLE_KEYWORD_RULES) {
      if (rule.pattern.test(title)) return rule.categoryName
    }
  }
  if (legacyCategory && LEGACY_CATEGORY_MAP[legacyCategory]) {
    return LEGACY_CATEGORY_MAP[legacyCategory]
  }
  return null
}

interface CategoryLookupClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export async function resolveCategoryAndIndustryIds(
  client: CategoryLookupClient,
  title: string | null | undefined,
  legacyCategory: string | null | undefined
): Promise<{ category_id: string | null; industry_id: string | null }> {
  const categoryName = resolveCategoryName(title, legacyCategory)
  if (!categoryName) return { category_id: null, industry_id: null }

  const { data: category } = await client
    .from('categories')
    .select('id, category_industries(industry_id)')
    .eq('name', categoryName)
    .maybeSingle()

  if (!category) return { category_id: null, industry_id: null }

  type Row = { id: string; category_industries: { industry_id: string }[] | null }
  const row = category as Row
  const industryId = row.category_industries?.[0]?.industry_id ?? null

  return { category_id: row.id, industry_id: industryId }
}

export async function resolveCategoryBySlugs(
  client: CategoryLookupClient,
  industrySlug: string | null | undefined,
  categorySlug: string | null | undefined,
): Promise<{ category_id: string | null; industry_id: string | null; legacyCategory: string | null }> {
  if (!categorySlug) return { category_id: null, industry_id: null, legacyCategory: null }

  const { data: category } = await client
    .from('categories')
    .select('id, slug, name, category_industries(industry_id, industries(slug))')
    .eq('slug', categorySlug.trim().toLowerCase())
    .maybeSingle()

  if (!category) return { category_id: null, industry_id: null, legacyCategory: null }

  type Row = {
    id: string
    slug: string
    name: string
    category_industries: { industry_id: string; industries: { slug: string } | null }[] | null
  }
  const row = category as Row
  const links = row.category_industries ?? []

  let industryId: string | null = links[0]?.industry_id ?? null
  if (industrySlug) {
    const match = links.find(l => l.industries?.slug === industrySlug.trim().toLowerCase())
    if (match) industryId = match.industry_id
  }

  const legacyCategory = row.slug.replace(/-/g, '_')

  return { category_id: row.id, industry_id: industryId, legacyCategory }
}
