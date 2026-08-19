import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { getListingLimitForAccount } from '@/lib/planLimits'
import type { MembershipPlan } from '@/lib/types/database'

const PAGE_SIZE = 25

type OrgMembershipRow = {
  user_id: string | null
  role: 'owner' | 'manager'
  is_primary_owner: boolean
  organization_id: string
  organizations: { id: string; name: string } | { id: string; name: string }[] | null
}

function orgName(
  organizations: OrgMembershipRow['organizations'],
): string | null {
  if (!organizations) return null
  if (Array.isArray(organizations)) return organizations[0]?.name ?? null
  return organizations.name ?? null
}

function roleSortKey(role: string | null | undefined, isPrimary: boolean): number {
  if (isPrimary) return 0
  if (role === 'owner') return 1
  if (role === 'manager') return 2
  return 3
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('search') ?? ''
  const plan = searchParams.get('plan') ?? ''
  const offset = (page - 1) * PAGE_SIZE

  const service = createServiceClient()

  const { data: memberships, error: membershipError } = await service
    .from('org_members')
    .select('user_id, role, is_primary_owner, organization_id, organizations(id, name)')
    .eq('status', 'active')
    .not('user_id', 'is', null)

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 })
  }

  const membershipByUser = new Map<string, {
    organization_id: string
    organization_name: string | null
    org_role: 'owner' | 'manager'
    is_primary_owner: boolean
  }>()

  for (const row of (memberships ?? []) as OrgMembershipRow[]) {
    if (!row.user_id) continue
    membershipByUser.set(row.user_id, {
      organization_id: row.organization_id,
      organization_name: orgName(row.organizations),
      org_role: row.role,
      is_primary_owner: row.is_primary_owner,
    })
  }

  let query = service
    .from('users')
    .select('id, email, full_name, company_name, phone, city, state, country, avatar_url, plan, role, suspended, created_at')

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (plan && plan !== 'enterprise') {
    query = query.eq('plan', plan)
  }

  const { data: users, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let rows = (users ?? []).map(u => {
    const membership = membershipByUser.get(u.id) ?? null
    const isEnterprise = Boolean(membership)
    return {
      ...u,
      plan: u.plan as MembershipPlan,
      is_enterprise: isEnterprise,
      organization_id: membership?.organization_id ?? null,
      organization_name: membership?.organization_name ?? null,
      org_role: membership?.org_role ?? null,
      is_primary_owner: membership?.is_primary_owner ?? false,
    }
  })

  if (plan === 'enterprise') {
    rows = rows.filter(u => u.is_enterprise)
  }

  rows.sort((a, b) => {
    const aOrg = a.organization_name?.toLowerCase() ?? ''
    const bOrg = b.organization_name?.toLowerCase() ?? ''
    const aHasOrg = Boolean(a.organization_id)
    const bHasOrg = Boolean(b.organization_id)

    // Enterprise users first, grouped by organization name
    if (aHasOrg !== bHasOrg) return aHasOrg ? -1 : 1
    if (aHasOrg && bHasOrg) {
      if (aOrg !== bOrg) return aOrg.localeCompare(bOrg)
      const roleDiff = roleSortKey(a.org_role, a.is_primary_owner) - roleSortKey(b.org_role, b.is_primary_owner)
      if (roleDiff !== 0) return roleDiff
    }

    const aName = (a.full_name ?? a.email).toLowerCase()
    const bName = (b.full_name ?? b.email).toLowerCase()
    if (aName !== bName) return aName.localeCompare(bName)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const total = rows.length
  const pageRows = rows.slice(offset, offset + PAGE_SIZE)

  const enriched = await Promise.all(
    pageRows.map(async u => {
      const [{ count: activeListingCount }, { count: savedCount }] = await Promise.all([
        service.from('listings').select('*', { count: 'exact', head: true })
          .eq('seller_id', u.id).eq('status', 'active'),
        service.from('saved_listings').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
      ])
      return {
        ...u,
        listing_count: activeListingCount ?? 0,
        listing_limit: getListingLimitForAccount(u.plan, u.is_enterprise),
        saved_count: savedCount ?? 0,
      }
    }),
  )

  return NextResponse.json({
    success: true,
    users: enriched,
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}
