/** Normalize org_members.team_tag (text[] in DB) for app use. */
export function normalizeTeamLocations(
  value: string | string[] | null | undefined,
): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(v => v.trim()).filter(Boolean)))
  }
  const single = value.trim()
  return single ? [single] : []
}

export function parseTeamTagInput(input: unknown): string[] | null {
  const normalized = normalizeTeamLocations(
    Array.isArray(input) ? input : typeof input === 'string' ? input : null,
  )
  return normalized.length > 0 ? normalized : null
}

export function locationsOverlap(
  a: string | string[] | null | undefined,
  b: string | string[] | null | undefined,
): boolean {
  const left = normalizeTeamLocations(a)
  const right = normalizeTeamLocations(b)
  if (left.length === 0 || right.length === 0) return false
  const rightSet = new Set(right)
  return left.some(loc => rightSet.has(loc))
}

export function isLocationSubset(
  subset: string | string[] | null | undefined,
  superset: string | string[] | null | undefined,
): boolean {
  const inner = normalizeTeamLocations(subset)
  const outer = new Set(normalizeTeamLocations(superset))
  return inner.every(loc => outer.has(loc))
}

export function collectDistinctLocations(
  members: Array<{ team_tag?: string | string[] | null }>,
): string[] {
  const set = new Set<string>()
  for (const member of members) {
    for (const loc of normalizeTeamLocations(member.team_tag)) {
      set.add(loc)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function formatLocationsLabel(
  value: string | string[] | null | undefined,
): string {
  const locations = normalizeTeamLocations(value)
  return locations.length > 0 ? locations.join(', ') : '—'
}

export function buildLocationAccessPreview(
  inviteeLabel: string,
  locations: string[],
  seeAllLocations = false,
): string {
  if (seeAllLocations) {
    const label = inviteeLabel.trim()
    if (label) {
      return `${label} will see listings from all locations, plus any listings posted by an Owner.`
    }
    return 'This person will see listings from all locations, plus any listings posted by an Owner.'
  }

  const locText = locations.length > 0 ? locations.join(', ') : '[Location(s)]'
  const label = inviteeLabel.trim()
  if (label) {
    return `${label} will see listings from ${locText}, plus any listings posted by an Owner.`
  }
  return `This person will see listings from ${locText}, plus any listings posted by an Owner.`
}

/** Manager location edits: may add only from manager set; may keep existing target locations. */
export function managerCanAssignLocations(
  managerLocations: string | string[] | null | undefined,
  targetLocations: string | string[] | null | undefined,
  proposedLocations: string | string[] | null | undefined,
): boolean {
  const proposed = normalizeTeamLocations(proposedLocations)
  if (proposed.length === 0) return false

  const manager = normalizeTeamLocations(managerLocations)
  const target = normalizeTeamLocations(targetLocations)
  const allowed = new Set([...manager, ...target])
  return proposed.every(loc => allowed.has(loc))
}
