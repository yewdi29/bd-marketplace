import type { SupabaseClient } from '@supabase/supabase-js'

export function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Unique public slug for organizations — must not collide with other orgs
 * or existing personal users.company_slug values.
 */
export async function generateUniqueOrganizationSlug(
  admin: SupabaseClient,
  companyName: string,
  currentOrgId?: string,
): Promise<string> {
  const base = slugifyCompanyName(companyName)
  if (!base) {
    const fallback = currentOrgId
      ? `org-${currentOrgId.replace(/-/g, '').slice(0, 8)}`
      : `org-${Math.random().toString(36).slice(2, 10)}`
    return fallback
  }

  const isTaken = async (candidate: string): Promise<boolean> => {
    const orgQuery = admin.from('organizations').select('id').eq('slug', candidate)
    const { data: orgHit } = currentOrgId
      ? await orgQuery.neq('id', currentOrgId).maybeSingle()
      : await orgQuery.maybeSingle()
    if (orgHit) return true

    const { data: userHit } = await admin
      .from('users')
      .select('id')
      .eq('company_slug', candidate)
      .maybeSingle()
    return Boolean(userHit)
  }

  if (!(await isTaken(base))) return base

  for (let i = 0; i < 8; i++) {
    const suffix = Math.random().toString(36).slice(2, 6)
    const candidate = `${base}-${suffix}`
    if (!(await isTaken(candidate))) return candidate
  }

  return `${base}-${Date.now().toString(36).slice(-4)}`
}

/**
 * Unique personal company slug — must not collide with other users or orgs.
 */
export async function generateUniqueUserCompanySlug(
  admin: SupabaseClient,
  companyName: string,
  currentUserId: string,
): Promise<string> {
  const base = slugifyCompanyName(companyName)
  if (!base) return ''

  const isTaken = async (candidate: string): Promise<boolean> => {
    const { data: userHit } = await admin
      .from('users')
      .select('id')
      .eq('company_slug', candidate)
      .neq('id', currentUserId)
      .maybeSingle()
    if (userHit) return true

    const { data: orgHit } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    return Boolean(orgHit)
  }

  if (!(await isTaken(base))) return base

  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}
