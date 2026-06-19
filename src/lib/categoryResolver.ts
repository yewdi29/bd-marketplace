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
  { pattern: /drilling rig/i, categoryName: 'Drilling Rigs' },
  { pattern: /blowout preventer|\bbop\b|wellhead|christmas tree/i, categoryName: 'Wellhead Equipment' },
  { pattern: /mud pump|pump jack|pumping unit/i, categoryName: 'Pumps & Pump Jacks' },
  { pattern: /separator|\btank\b/i, categoryName: 'Separators & Tanks' },
  { pattern: /compressor/i, categoryName: 'Compressors' },
  { pattern: /drill bit/i, categoryName: 'Drill Bits' },
]

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  drilling_rig: 'Drilling Rigs',
  rig: 'Drilling Rigs',
  drill_pipe: 'Drill Pipe & Tubulars',
  drill_collar: 'Drill Pipe & Tubulars',
  tubular_goods: 'Drill Pipe & Tubulars',
  blowout_preventer: 'Wellhead Equipment',
  wellhead: 'Wellhead Equipment',
  completion_equipment: 'Wellhead Equipment',
  pumping_unit: 'Pumps & Pump Jacks',
  mud_pump: 'Pumps & Pump Jacks',
  artificial_lift: 'Pumps & Pump Jacks',
  coiled_tubing: 'Coiled Tubing Equipment',
  compressor: 'Compressors',
  separator: 'Separators & Tanks',
  tank: 'Separators & Tanks',
  production_equipment: 'Separators & Tanks',
  wireline: 'Fishing & Rental Tools',
  rental_tools: 'Fishing & Rental Tools',
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
