import type { SupabaseClient } from '@supabase/supabase-js'
import type { Listing, MembershipPlan } from '@/lib/types/database'
import { generateUniqueOrganizationSlug } from '@/lib/sellers/companySlug'

export type PublicSellerKind = 'organization' | 'user'

export interface PublicSellerProfile {
  kind: PublicSellerKind
  id: string
  company_name: string | null
  company_logo_url: string | null
  company_slug: string | null
  description: string | null
  city: string | null
  state: string | null
  country: string | null
  plan: MembershipPlan
  created_at: string
}

const LISTING_SELECT = '*, listing_images(*), countries(name, iso_code), categories(name)'

async function bestMemberPlan(
  admin: SupabaseClient,
  organizationId: string,
): Promise<MembershipPlan> {
  const { data: members } = await admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .not('user_id', 'is', null)

  const userIds = (members ?? []).map(m => m.user_id as string).filter(Boolean)
  if (userIds.length === 0) return 'free'

  const { data: users } = await admin
    .from('users')
    .select('plan')
    .in('id', userIds)

  const priority: Record<string, number> = {
    max: 1,
    pro: 2,
    premium: 2,
    starter: 3,
    free: 4,
  }
  let best: MembershipPlan = 'free'
  let bestRank = 4
  for (const u of users ?? []) {
    const rank = priority[u.plan] ?? 4
    if (rank < bestRank) {
      best = u.plan as MembershipPlan
      bestRank = rank
    }
  }
  return best
}

export async function ensureOrganizationHasSlug(
  admin: SupabaseClient,
  org: { id: string; name: string; slug: string | null },
): Promise<string | null> {
  if (org.slug) return org.slug
  const slug = await generateUniqueOrganizationSlug(admin, org.name, org.id)
  const { error } = await admin
    .from('organizations')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('id', org.id)
  if (error) return null
  return slug
}

export async function resolvePublicSellerBySlug(
  admin: SupabaseClient,
  slug: string,
): Promise<PublicSellerProfile | null> {
  const { data: org } = await admin
    .from('organizations')
    .select('id, name, logo_url, slug, description, created_at')
    .eq('slug', slug)
    .maybeSingle()

  if (org) {
    const { data: primary } = await admin
      .from('org_members')
      .select('user_id')
      .eq('organization_id', org.id)
      .eq('is_primary_owner', true)
      .eq('status', 'active')
      .maybeSingle()

    let city: string | null = null
    let state: string | null = null
    let country: string | null = null
    if (primary?.user_id) {
      const { data: owner } = await admin
        .from('users')
        .select('city, state, country')
        .eq('id', primary.user_id)
        .maybeSingle()
      city = owner?.city ?? null
      state = owner?.state ?? null
      country = owner?.country ?? null
    }

    return {
      kind: 'organization',
      id: org.id,
      company_name: org.name,
      company_logo_url: org.logo_url,
      company_slug: org.slug,
      description: org.description,
      city,
      state,
      country,
      plan: await bestMemberPlan(admin, org.id),
      created_at: org.created_at,
    }
  }

  const { data: user } = await admin
    .from('users')
    .select('id, company_name, company_logo_url, company_slug, city, state, country, plan, created_at')
    .eq('company_slug', slug)
    .maybeSingle()

  if (!user) return null

  // Org members should not have a separate public directory page
  const { data: membership } = await admin
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership) return null

  return {
    kind: 'user',
    id: user.id,
    company_name: user.company_name,
    company_logo_url: user.company_logo_url,
    company_slug: user.company_slug,
    description: null,
    city: user.city,
    state: user.state,
    country: user.country,
    plan: user.plan as MembershipPlan,
    created_at: user.created_at,
  }
}

export async function loadPublicSellerListings(
  admin: SupabaseClient,
  profile: PublicSellerProfile,
): Promise<{ active: Listing[]; sold: Listing[] }> {
  if (profile.kind === 'organization') {
    const { data: members } = await admin
      .from('org_members')
      .select('user_id')
      .eq('organization_id', profile.id)
      .eq('status', 'active')
      .not('user_id', 'is', null)

    const memberIds = (members ?? []).map(m => m.user_id as string).filter(Boolean)

    const [{ data: activeByOrg }, { data: soldByOrg }] = await Promise.all([
      admin
        .from('listings')
        .select(LISTING_SELECT)
        .eq('organization_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      admin
        .from('listings')
        .select(LISTING_SELECT)
        .eq('organization_id', profile.id)
        .eq('status', 'sold')
        .order('updated_at', { ascending: false }),
    ])

    // Include any member listings still missing organization_id
    let activeExtra: Listing[] = []
    let soldExtra: Listing[] = []
    if (memberIds.length > 0) {
      const [{ data: a }, { data: s }] = await Promise.all([
        admin
          .from('listings')
          .select(LISTING_SELECT)
          .in('seller_id', memberIds)
          .is('organization_id', null)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        admin
          .from('listings')
          .select(LISTING_SELECT)
          .in('seller_id', memberIds)
          .is('organization_id', null)
          .eq('status', 'sold')
          .order('updated_at', { ascending: false }),
      ])
      activeExtra = (a ?? []) as Listing[]
      soldExtra = (s ?? []) as Listing[]
    }

    return {
      active: [...((activeByOrg ?? []) as Listing[]), ...activeExtra],
      sold: [...((soldByOrg ?? []) as Listing[]), ...soldExtra],
    }
  }

  const [{ data: active }, { data: sold }] = await Promise.all([
    admin
      .from('listings')
      .select(LISTING_SELECT)
      .eq('seller_id', profile.id)
      .is('organization_id', null)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    admin
      .from('listings')
      .select(LISTING_SELECT)
      .eq('seller_id', profile.id)
      .is('organization_id', null)
      .eq('status', 'sold')
      .order('updated_at', { ascending: false }),
  ])

  return {
    active: (active ?? []) as Listing[],
    sold: (sold ?? []) as Listing[],
  }
}

/** Public "Listed By" identity for a listing detail page. */
export async function resolveListingSellerDisplay(
  admin: SupabaseClient,
  listing: { seller_id: string; organization_id: string | null },
): Promise<{
  company_name: string | null
  company_logo_url: string | null
  company_slug: string | null
  plan: MembershipPlan
  created_at: string
} | null> {
  if (listing.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, logo_url, slug, created_at')
      .eq('id', listing.organization_id)
      .maybeSingle()

    if (org) {
      let slug = org.slug
      if (!slug) {
        slug = await ensureOrganizationHasSlug(admin, org)
      }
      return {
        company_name: org.name,
        company_logo_url: org.logo_url,
        company_slug: slug,
        plan: await bestMemberPlan(admin, org.id),
        created_at: org.created_at,
      }
    }
  }

  const { data: seller } = await admin
    .from('users')
    .select('company_name, company_logo_url, company_slug, plan, created_at')
    .eq('id', listing.seller_id)
    .maybeSingle()

  if (!seller) return null

  // If seller is an org member, prefer the organization brand even when listing
  // is missing organization_id (legacy / unggrandfathered rows).
  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', listing.seller_id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership?.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, logo_url, slug, created_at')
      .eq('id', membership.organization_id)
      .maybeSingle()

    if (org) {
      let slug = org.slug
      if (!slug) {
        slug = await ensureOrganizationHasSlug(admin, org)
      }
      return {
        company_name: org.name,
        company_logo_url: org.logo_url,
        company_slug: slug,
        plan: await bestMemberPlan(admin, org.id),
        created_at: org.created_at,
      }
    }
  }

  return {
    company_name: seller.company_name,
    company_logo_url: seller.company_logo_url,
    company_slug: seller.company_slug,
    plan: seller.plan as MembershipPlan,
    created_at: seller.created_at,
  }
}
