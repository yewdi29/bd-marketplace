import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import { getAuthUser } from '@/lib/supabase/auth-server'
import { createClient } from '@/lib/supabase/server'
import type { Listing, MembershipPlan } from '@/lib/types/database'

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
    <section className="py-10 border-t border-[#E8E9EA]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-[#F0F0F0] rounded-lg animate-pulse" />
          <div className="mt-2 h-4 w-64 bg-[#F0F0F0] rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
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

  let featuredCarousel: Listing[] = []
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: eligibleListings } = await adminClient
      .from('listings')
      .select('*, listing_images(*), countries(name, iso_code)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(80)

    if (eligibleListings && eligibleListings.length > 0) {
      const sellerIds = Array.from(new Set(eligibleListings.map((l: Listing) => l.seller_id)))
      const { data: users } = await adminClient
        .from('users')
        .select('id, plan')
        .in('id', sellerIds)

      const planMap = new Map<string, MembershipPlan>(
        (users ?? []).map((u: { id: string; plan: MembershipPlan }) => [u.id, u.plan]),
      )

      const eligible = (eligibleListings as Listing[]).filter(l => {
        const plan = planMap.get(l.seller_id) ?? 'free'
        return plan !== 'free'
      })

      const windowSeed = Math.floor(Date.now() / (5 * 24 * 60 * 60 * 1000))

      const byWeight = eligible.reduce<Record<number, Listing[]>>((acc, l) => {
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
        .slice(0, 5)
    }
  } catch {
    // Service role unavailable in local dev — skip carousel gracefully
  }

  if (featuredCarousel.length === 0) return null

  return (
    <section className="py-10 border-t border-[#E8E9EA]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2
            className="font-sans font-bold text-2xl text-ink"
            style={{ letterSpacing: '-0.02em' }}
          >
            Featured Equipment
          </h2>
          <p className="mt-1 text-sm font-sans text-ink-3">
            Hand-picked listings from verified sellers
          </p>
        </div>
        <Link
          href="/search?featured=true"
          className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
        >
          View all →
        </Link>
      </div>
      <FeaturedCarousel
        listings={featuredCarousel}
        isLoggedIn={!!user}
        savedIds={Array.from(savedIds)}
      />
    </section>
  )
}
