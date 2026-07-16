export interface EnterpriseDealMetadata {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  estimated_team_size: number
  locations_regions: string
  message: string | null
  submitted_at: string
}

export function parseEnterpriseMetadata(
  raw: Record<string, unknown> | null,
): EnterpriseDealMetadata | null {
  if (!raw || typeof raw.company_name !== 'string') return null
  return {
    company_name: raw.company_name,
    contact_name: typeof raw.contact_name === 'string' ? raw.contact_name : '',
    contact_email: typeof raw.contact_email === 'string' ? raw.contact_email : '',
    contact_phone: typeof raw.contact_phone === 'string' ? raw.contact_phone : null,
    estimated_team_size: typeof raw.estimated_team_size === 'number' ? raw.estimated_team_size : 0,
    locations_regions: typeof raw.locations_regions === 'string' ? raw.locations_regions : '',
    message: typeof raw.message === 'string' ? raw.message : null,
    submitted_at: typeof raw.submitted_at === 'string' ? raw.submitted_at : '',
  }
}
