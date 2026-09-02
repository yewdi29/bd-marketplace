import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'

export interface DirectorySellerEntry {
  id: string
  kind: 'organization' | 'user'
  company_name: string | null
  company_logo_url: string | null
  company_slug: string | null
  city: string | null
  state: string | null
  plan: MembershipPlan
  active_count: number
}

const PLAN_PRIORITY: Record<string, number> = {
  max: 1,
  pro: 2,
  premium: 2,
  starter: 3,
  free: 4,
}

function bestPlan(plans: Array<MembershipPlan | string | null | undefined>): MembershipPlan {
  let best: MembershipPlan = 'free'
  let bestRank = PLAN_PRIORITY.free
  for (const plan of plans) {
    if (!plan) continue
    const rank = PLAN_PRIORITY[plan] ?? 4
    if (rank < bestRank) {
      best = plan as MembershipPlan
      bestRank = rank
    }
  }
  return best
}

/**
 * Build business-directory cards:
 * - One card per organization that has active org-attributed listings
 * - One card per solo user with active personal listings (not an active org member)
 */
export async function loadDirectorySellerEntries(
  admin: SupabaseClient,
): Promise<DirectorySellerEntry[]> {
  const [
    { data: orgs },
    { data: users },
    { data: activeListings },
    { data: activeMembers },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, name, logo_url, slug, created_at')
      .not('slug', 'is', null),
    admin
      .from('users')
      .select('id, company_name, company_logo_url, company_slug, city, state, plan')
      .not('company_slug', 'is', null)
      .not('company_name', 'is', null),
    admin
      .from('listings')
      .select('seller_id, organization_id')
      .eq('status', 'active'),
    admin
      .from('org_members')
      .select('user_id, organization_id')
      .eq('status', 'active')
      .not('user_id', 'is', null),
  ])

  const orgMemberUserIds = new Set(
    (activeMembers ?? [])
      .map(m => m.user_id as string | null)
      .filter((id): id is string => Boolean(id)),
  )

  const orgActiveCounts = new Map<string, number>()
  const userActiveCounts = new Map<string, number>()

  for (const row of activeListings ?? []) {
    const orgId = row.organization_id as string | null
    const sellerId = row.seller_id as string
    if (orgId) {
      orgActiveCounts.set(orgId, (orgActiveCounts.get(orgId) ?? 0) + 1)
    } else if (!orgMemberUserIds.has(sellerId)) {
      userActiveCounts.set(sellerId, (userActiveCounts.get(sellerId) ?? 0) + 1)
    } else {
      // Org member listing missing organization_id — still count under their org
      const membership = (activeMembers ?? []).find(m => m.user_id === sellerId)
      if (membership?.organization_id) {
        orgActiveCounts.set(
          membership.organization_id,
          (orgActiveCounts.get(membership.organization_id) ?? 0) + 1,
        )
      }
    }
  }

  // Location + plan for orgs: primary owner when available, else best member plan
  const orgIdsWithListings = Array.from(orgActiveCounts.entries())
    .filter(([, count]) => count > 0)
    .map(([id]) => id)

  const memberUserIds = (activeMembers ?? [])
    .filter(m => orgIdsWithListings.includes(m.organization_id))
    .map(m => m.user_id as string)

  const { data: memberUsers } = memberUserIds.length > 0
    ? await admin
      .from('users')
      .select('id, city, state, plan')
      .in('id', Array.from(new Set(memberUserIds)))
    : { data: [] as Array<{ id: string; city: string | null; state: string | null; plan: MembershipPlan }> }

  const { data: primaryOwners } = orgIdsWithListings.length > 0
    ? await admin
      .from('org_members')
      .select('organization_id, user_id')
      .in('organization_id', orgIdsWithListings)
      .eq('is_primary_owner', true)
      .eq('status', 'active')
    : { data: [] as Array<{ organization_id: string; user_id: string | null }> }

  const userById = new Map((memberUsers ?? []).map(u => [u.id, u]))
  const membersByOrg = new Map<string, string[]>()
  for (const m of activeMembers ?? []) {
    if (!m.user_id) continue
    const list = membersByOrg.get(m.organization_id) ?? []
    list.push(m.user_id)
    membersByOrg.set(m.organization_id, list)
  }

  const orgEntries: DirectorySellerEntry[] = (orgs ?? [])
    .filter(o => (orgActiveCounts.get(o.id) ?? 0) > 0 && o.slug)
    .map(o => {
      const primary = (primaryOwners ?? []).find(p => p.organization_id === o.id)
      const primaryUser = primary?.user_id ? userById.get(primary.user_id) : undefined
      const memberPlans = (membersByOrg.get(o.id) ?? [])
        .map(uid => userById.get(uid)?.plan)
      return {
        id: o.id,
        kind: 'organization' as const,
        company_name: o.name,
        company_logo_url: o.logo_url,
        company_slug: o.slug,
        city: primaryUser?.city ?? null,
        state: primaryUser?.state ?? null,
        plan: bestPlan(memberPlans.length > 0 ? memberPlans : [primaryUser?.plan]),
        active_count: orgActiveCounts.get(o.id) ?? 0,
      }
    })

  const userEntries: DirectorySellerEntry[] = (users ?? [])
    .filter(u =>
      !orgMemberUserIds.has(u.id)
      && (userActiveCounts.get(u.id) ?? 0) > 0
      && u.company_slug,
    )
    .map(u => ({
      id: u.id,
      kind: 'user' as const,
      company_name: u.company_name,
      company_logo_url: u.company_logo_url,
      company_slug: u.company_slug,
      city: u.city,
      state: u.state,
      plan: u.plan as MembershipPlan,
      active_count: userActiveCounts.get(u.id) ?? 0,
    }))

  return [...orgEntries, ...userEntries].sort((a, b) => {
    const tierDiff = (PLAN_PRIORITY[a.plan] ?? 4) - (PLAN_PRIORITY[b.plan] ?? 4)
    if (tierDiff !== 0) return tierDiff
    return b.active_count - a.active_count
  })
}
