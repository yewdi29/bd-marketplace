export type UserRole = 'buyer' | 'seller' | 'admin'
export type MembershipPlan = 'free' | 'starter' | 'pro' | 'max' | 'premium' // 'premium' kept for legacy rows
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'removed'
export type ListingTier = 'green' | 'yellow' | 'red'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'
export type ArticleStatus = 'draft' | 'published' | 'archived'
export type ArticleCategory =
  | 'drill_pipe'
  | 'upstream'
  | 'midstream'
  | 'downstream'
  | 'equipment_guides'
  | 'market_news'
  | 'industry'
export type SubscriberStatus = 'active' | 'unsubscribed'

export type OrgMemberRole = 'owner' | 'manager'
export type OrgMemberStatus = 'invited' | 'active' | 'expired'
export type OrgPreferredPaymentMethod = 'card' | 'ach'
export type SeatChangeType = 'add' | 'remove'
export type SeatChangeStatus = 'pending' | 'confirmed' | 'failed'
export type DealType = 'equipment' | 'enterprise'

export interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  avatar_url: string | null
  company_logo_url: string | null
  company_slug: string | null
  city: string | null
  state: string | null
  country: string | null
  signup_ip_location: string | null
  email_domain: string | null
  company_name_duplicate: boolean
  role: UserRole
  plan: MembershipPlan
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  logo_url: string | null
  description: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  base_seat_count: number
  preferred_payment_method: OrgPreferredPaymentMethod | null
  billing_interval: 'monthly' | 'annual' | null
  enterprise_terms_accepted_at: string | null
  enterprise_terms_version: string | null
  last_billing_failure_at: string | null
  last_billing_failure_message: string | null
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  organization_id: string
  user_id: string | null
  role: OrgMemberRole
  team_tag: string[] | null
  is_primary_owner: boolean
  status: OrgMemberStatus
  can_see_all_locations: boolean
  can_access_billing: boolean
  can_edit_company_info: boolean
  can_manage_managers_org_wide: boolean
  invited_email: string | null
  invite_token: string | null
  invite_expires_at: string | null
  joined_at: string | null
  created_at: string
}

export interface SeatChangeLog {
  id: string
  organization_id: string
  change_type: SeatChangeType
  seat_count_before: number
  seat_count_after: number
  prorated_amount: number | null
  stripe_invoice_id: string | null
  payment_method_used: OrgPreferredPaymentMethod | null
  status: SeatChangeStatus
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  organization_id: string | null
  posted_by_user_id: string | null
  title: string
  description: string | null
  category: string
  manufacturer: string | null
  model: string | null
  year: number | null
  condition: string | null
  price: number
  price_unit: string
  price_negotiable: boolean
  price_visible: boolean
  location_city: string | null
  location_state: string | null
  tags: string[] | null
  specs: Record<string, string> | null
  video_url: string | null
  status: ListingStatus
  tier: ListingTier | null
  featured: boolean
  view_count: number
  slug: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  listing_images?: ListingImage[]
  // Industry / category taxonomy — nullable until a listing has been
  // migrated or created against the new structure (see migrations).
  industry_id: string | null
  category_id: string | null
  // Country / region / state taxonomy — same nullability rationale.
  country_id: string | null
  region_id: string | null
  state_id: string | null
  latitude: number | null
  longitude: number | null
  last_approved_at: string | null
  last_major_edit_at: string | null
}

export interface Industry {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Country {
  id: string
  name: string
  slug: string
  iso_code: string | null
  created_at: string
}

export interface Region {
  id: string
  country_id: string
  name: string
  slug: string
  created_at: string
}

export interface State {
  id: string
  region_id: string
  name: string
  code: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface Lead {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string | null
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  buyer_company: string | null
  message: string
  status: LeadStatus
  tier: ListingTier | null
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  body: string
  category: ArticleCategory
  status: ArticleStatus
  featured_image: string | null
  meta_description: string | null
  tags: string[] | null
  read_time_mins: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  status: SubscriberStatus
  source: string | null
  subscribed_at: string
  unsubscribed_at: string | null
}
