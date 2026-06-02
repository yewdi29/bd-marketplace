// Oil & gas industry synonym map.
// Keys are canonical terms; values are synonyms that mean the same thing in the field.
// expandSearchQuery() uses this to broaden searches so e.g. "pipe rack" also
// hits listings titled "pipe stacker" or "tubular rack".

export const oilGasSynonyms: Record<string, string[]> = {
  'coil tubing':   ['coiled tubing', 'ct unit', 'injector head', 'coil reel'],
  'pipe rack':     ['pipe stacker', 'pipe storage', 'tubular rack', 'pipe handling'],
  'bop':           ['blowout preventer', 'annular preventer', 'ram bop', 'wellhead control'],
  'drill pipe':    ['dp', 'drill string', 'tubulars', 'drillpipe'],
  'mud pump':      ['triplex pump', 'duplex pump', 'drilling pump', 'piston pump'],
  'rig':           ['drilling rig', 'workover rig', 'completion rig', 'service rig'],
  'wellhead':      ['christmas tree', 'casing head', 'tubing head'],
  'tank':          ['frac tank', 'production tank', 'storage tank', 'fluid tank'],
  'compressor':    ['gas compressor', 'air compressor', 'reciprocating compressor'],
  'generator':     ['power unit', 'genset', 'diesel generator'],
  'crane':         ['picker crane', 'hydraulic crane', 'knuckle boom'],
  'swivel':        ['kelly swivel', 'top drive swivel', 'rotary swivel'],
  'choke':         ['choke manifold', 'adjustable choke', 'positive choke'],
  'casing':        ['surface casing', 'production casing', 'conductor pipe'],
  'tubing':        ['production tubing', 'tbg', 'oil country tubular'],
}

/**
 * Expand a search query with oil & gas synonyms and format it for to_tsquery().
 *
 * Multi-word terms are joined with & (AND within a phrase).
 * Different synonym alternatives are joined with | (OR between alternatives).
 *
 * @example
 * expandSearchQuery('pipe rack')
 * // → "pipe & rack | pipe & stacker | pipe & storage | tubular & rack | pipe & handling"
 */
export function expandSearchQuery(query: string): string {
  const lower = query.toLowerCase().trim()
  const terms = new Set<string>([lower])

  Object.entries(oilGasSynonyms).forEach(([key, values]) => {
    if (lower.includes(key)) {
      values.forEach(v => terms.add(v))
    }
    values.forEach(v => {
      if (lower.includes(v)) {
        terms.add(key)
        values.forEach(sv => terms.add(sv))
      }
    })
  })

  // Format each term for to_tsquery:
  // multi-word terms use & between words ("pipe rack" → "pipe & rack")
  const tsTerms = Array.from(terms).map(term =>
    term.trim().split(/\s+/).join(' & ')
  )

  // Join all alternatives with | (OR)
  return tsTerms.join(' | ')
}

/**
 * Strip size/measurement terms from a query so the synonym-expanded Stage 2
 * search focuses on equipment type rather than a specific dimension.
 *
 * Removes: fractions (7/8, 2-7/8), decimals (4.5), Unicode vulgar fractions
 * (½ ¾ ⅝ …), numbers, and common measurement abbreviations (inch, OD, REG …).
 *
 * @example
 * stripMeasurements('9½ Spiral Drill Collar 7⅝ REG Connection')
 * // → "Spiral Drill Collar Connection"
 *
 * stripMeasurements('5 inch drill pipe')
 * // → "drill pipe"
 */
export function stripMeasurements(query: string): string {
  return query
    // Unicode vulgar fractions: ½ ¼ ¾ ⅛ ⅜ ⅝ ⅞ ⅓ ⅔ ⅕ ⅖ ⅗ ⅘ ⅙ ⅚ etc.
    .replace(/[½¼¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]/g, ' ')
    // Compound fractions with dash: 2-7/8
    .replace(/\d+-\d+\/\d+/g, ' ')
    // Simple fractions: 7/8, 5/8
    .replace(/\d+\/\d+/g, ' ')
    // Decimal numbers: 4.5, 9.625
    .replace(/\d+\.\d+/g, ' ')
    // Numbers immediately followed by a unit (with optional space)
    .replace(/\d+\s*(inch(?:es)?|in\b|ft\b|feet|foot|mm\b|cm\b|od\b|id\b|lbs?\b|kg\b|psi\b|hp\b|rpm\b)/gi, ' ')
    // Standalone measurement abbreviations
    .replace(/\b(inch(?:es)?|in|ft|feet|foot|mm|cm|od|id|lbs?|kg|psi|hp|rpm|reg|api)\b/gi, ' ')
    // Remaining standalone integers
    .replace(/\b\d+\b/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sanitize raw user input so it can't inject malicious tsquery operators.
 * Keeps only alphanumeric characters and spaces.
 */
export function sanitizeForTsQuery(term: string): string {
  return term
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Build a safe to_tsquery()-compatible expression from raw user input.
 * 1. Sanitize the raw query (remove special chars)
 * 2. Expand with synonyms
 * 3. Result is already formatted with & and | operators
 */
export function buildTsQuery(rawQuery: string): string {
  const sanitized = sanitizeForTsQuery(rawQuery)
  if (!sanitized) return ''
  return expandSearchQuery(sanitized)
}
