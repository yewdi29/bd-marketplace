import type { ArticleCategory, ArticleStatus, ListingStatus, MembershipPlan } from '@/lib/types/database'

export type DealTier = 'yellow' | 'red'
export type DealStatus = 'identified' | 'contacted' | 'negotiating' | 'closed_won' | 'closed_lost'

export interface Deal {
  id: string
  listing_id: string | null
  deal_tier: DealTier
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  seller_name: string | null
  asking_price: number | null
  final_sale_price: number | null
  commission_rate: number | null
  commission_earned: number | null
  status: DealStatus
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  listing_title?: string | null
  assigned_name?: string | null
}

export interface AdminLeadRow {
  id: string
  listing_id: string | null
  seller_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  buyer_company: string | null
  message: string
  status: string
  tier: string | null
  listing_title: string | null
  listing_slug: string | null
  listing_price: number | null
  listing_price_unit: string | null
  listing_tier: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_name: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  city: string | null
  state: string | null
  country: string | null
  avatar_url: string | null
  plan: MembershipPlan
  role: string
  suspended: boolean
  listing_count: number
  listing_limit: number | null
  saved_count: number
  created_at: string
}

export interface AdminListingRow {
  id: string
  title: string
  slug: string | null
  seller_id: string
  seller_name: string | null
  seller_email: string | null
  category: string
  industry_name: string | null
  price: number
  price_unit: string
  price_visible: boolean
  location_city: string | null
  location_state: string | null
  status: ListingStatus
  tier: string | null
  admin_flagged: boolean
  created_at: string
  primary_image_url: string | null
}

export interface DashboardStats {
  total_users: number
  active_listings: number
  total_listings: number
  mrr: number
  new_signups_month: number
  new_listings_month: number
  users_trend_pct: number | null
  active_listings_trend_pct: number | null
  total_listings_trend_pct: number | null
  mrr_trend_pct: number | null
  signups_trend_pct: number | null
  listings_trend_pct: number | null
}

export interface ArticleFormData {
  title: string
  slug: string
  body: string
  category: ArticleCategory
  status: ArticleStatus
  tags: string[]
  read_time_mins: number | null
  meta_description: string | null
  featured_image: string | null
  published_at: string | null
}

export const DEAL_STATUSES: { id: DealStatus; label: string }[] = [
  { id: 'identified', label: 'Identified' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'negotiating', label: 'In Negotiation' },
  { id: 'closed_won', label: 'Closed Won' },
  { id: 'closed_lost', label: 'Closed Lost' },
]

export const ARTICLE_CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'drill_pipe', label: 'Drill Pipe' },
  { value: 'upstream', label: 'Upstream' },
  { value: 'midstream', label: 'Midstream' },
  { value: 'downstream', label: 'Downstream' },
  { value: 'equipment_guides', label: 'Equipment Guides' },
  { value: 'market_news', label: 'Market News' },
  { value: 'industry', label: 'Industry' },
]
