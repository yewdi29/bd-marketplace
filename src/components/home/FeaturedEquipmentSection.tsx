import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import { getAuthUser } from '@/lib/supabase/auth-server'
import { createClient } from '@/lib/supabase/server'
import type { MembershipPlan } from '@/lib/types/database'

const TIER_WEIGHT: Record<MembershipPlan, number> = {
  max:     4,
  pro:     3,
  starter: 2,
  premium: 1,
  free:    0,
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function FeaturedCarouselSkeleton() {
  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="h-9 w-56 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse" />
          <div className="mt-4 h-5 w-72 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[#E8E9EA] overflow-hidden">
            <div className="aspect-[4/3] bg-[#F0F0F0] animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-20 bg-[#F0F0F0] rounded animate-pulse" />
              <div className="h-4 w-full bg-[#F0F0F0] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[#F0F0F0] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function toFeaturedListing(row: {
  id: string
  slug: string | null
  title: string
  category: string
  price: number
  price_unit: string
  price_visible: boolean
  location_city: string | null
  location_state: string | null
  created_at: string
  seller_id: string
  listing_images?: ListingCardListing['listing_images']
  countries?: { name: string; iso_code: string | null } | { name: string; iso_code: string | null }[] | null
  categories?: { name: string } | { name: string }[] | null
}): ListingCardListing {
  const countries = Array.isArray(row.countries) ? row.countries[0] ?? null : row.countries ?? null
  const categories = Array.isArray(row.categories) ? row.categories[0] ?? null : row.categories ?? null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    category_name: categories?.name ?? null,
    categories,
    price: row.price,
    price_unit: row.price_unit,
    price_visible: row.price_visible,
    location_city: row.location_city,
    location_state: row.location_state,
    created_at: row.created_at,
    listing_images: row.listing_images,
    countries,
  }
}

export default async function FeaturedEquipmentSection() {
  const user = await getAuthUser()

  let savedIds = new Set<string>()
  if (user) {
    const supabase = await createClient()
    const { data: saved } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id)
    savedIds = new Set((saved ?? []).map((s: { listing_id: string }) => s.listing_id))
  }

  let featuredCarousel: ListingCardListing[] = []
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: eligibleListings } = await adminClient
      .from('listings')
      .select(
        'id, title, category, price, price_unit, price_visible, status, slug, seller_id, created_at, location_city, location_state, listing_images(url, is_primary, alt_text, sort_order), countries(name, iso_code), categories(name)',
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30)

    if (eligibleListings && eligibleListings.length > 0) {
      const sellerIds = Array.from(new Set(eligibleListings.map(l => l.seller_id)))
      const { data: users } = await adminClient
        .from('users')
        .select('id, plan')
        .in('id', sellerIds)

      const planMap = new Map<string, MembershipPlan>(
        (users ?? []).map((u: { id: string; plan: MembershipPlan }) => [u.id, u.plan]),
      )

      const eligibleRows = eligibleListings.filter(l => {
        const plan = planMap.get(l.seller_id) ?? 'free'
        return plan !== 'free'
      })

      const windowSeed = Math.floor(Date.now() / (5 * 24 * 60 * 60 * 1000))

      const byWeight = eligibleRows.reduce<Record<number, typeof eligibleRows>>((acc, l) => {
        const plan = planMap.get(l.seller_id) ?? 'free'
        const w = TIER_WEIGHT[plan] ?? 0
        if (!acc[w]) acc[w] = []
        acc[w].push(l)
        return acc
      }, {})

      featuredCarousel = Object.keys(byWeight)
        .map(Number)
        .sort((a, b) => b - a)
        .flatMap(w => seededShuffle(byWeight[w], windowSeed + w))
        .slice(0, 9)
        .map(toFeaturedListing)
    }
  } catch {
    // Service role unavailable in local dev — skip carousel gracefully
  }

  if (featuredCarousel.length === 0) return null

  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]">
      <HomeSectionHeader linkHref="/search?featured=true" linkLabel="View all →">
        <h2
          className="font-sans font-bold text-ink"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Featured Equipment
        </h2>
        <p className="mt-4 font-sans text-ink-3 text-base leading-relaxed">
          Hand-picked listings from verified sellers
        </p>
      </HomeSectionHeader>
      <FeaturedCarousel
        listings={featuredCarousel}
        isLoggedIn={!!user}
        savedIds={Array.from(savedIds)}
      />
    </section>
  )
}
