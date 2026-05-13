export type UserRole = 'buyer' | 'seller' | 'admin'
export type MembershipPlan = 'free' | 'premium'
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

export interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  country: string | null
  signup_ip_location: string | null
  role: UserRole
  plan: MembershipPlan
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  category: string
  manufacturer: string | null
  model: string | null
  year: number | null
  condition: string | null
  price: number
  price_negotiable: boolean
  location_city: string | null
  location_state: string | null
  status: ListingStatus
  tier: ListingTier | null
  featured: boolean
  view_count: number
  slug: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  listing_images?: ListingImage[]
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
