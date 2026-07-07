import type { ListingStatus, MembershipPlan } from '@/lib/types/database'

export const PLAN_ORDER: MembershipPlan[] = ['free', 'starter', 'pro', 'max']

export const PLAN_BAR_COLORS: Record<MembershipPlan, string> = {
  free: '#71717A',
  starter: '#7ab82e',
  pro: '#4ab8c4',
  max: '#c472c2',
  premium: '#c472c2',
}

export const PLAN_LABELS: Record<MembershipPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  max: 'Max',
  premium: 'Premium',
}

export const ANALYTICS_PLAN_ORDER = ['free', 'starter', 'pro', 'max'] as const

export const LISTING_STATUS_BAR_COLORS: Record<ListingStatus, string> = {
  active: '#16A34A',
  removed: '#DC2626',
  draft: '#6B7280',
  pending_review: '#D97706',
  sold: '#16A34A',
}

export function listingStatusBarColor(status: string): string {
  return LISTING_STATUS_BAR_COLORS[status as ListingStatus] ?? '#9CA3AF'
}
