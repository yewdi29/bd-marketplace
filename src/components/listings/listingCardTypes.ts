// Shared listing card types — safe to import from server or client modules.

export interface ListingCardListing {
  id: string
  slug: string | null
  title: string
  category: string
  /** Preferred display name from taxonomy (preserves ampersands). */
  category_name?: string | null
  /** Nested taxonomy join from Supabase selects. */
  categories?: { name: string } | null
  price: number
  price_unit: string
  price_visible: boolean | null
  location_city: string | null
  location_state: string | null
  created_at: string
  listing_images?: {
    url: string
    is_primary: boolean
    alt_text?: string | null
  }[]
  countries?: {
    name: string
    iso_code: string | null
  } | null
}

/** Map dashboard API row → shared card listing shape. */
export function toListingCardListing(input: {
  id: string
  slug: string | null
  title: string
  category: string
  category_name?: string | null
  price: number
  price_unit: string
  price_visible: boolean | null
  location_city: string | null
  location_state: string | null
  created_at: string
  primary_image_url?: string | null
  listing_images?: ListingCardListing['listing_images']
  countries?: ListingCardListing['countries']
  categories?: { name: string } | null
}): ListingCardListing {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    category: input.category,
    category_name: input.category_name ?? input.categories?.name ?? null,
    categories: input.categories ?? null,
    price: input.price,
    price_unit: input.price_unit,
    price_visible: input.price_visible,
    location_city: input.location_city,
    location_state: input.location_state,
    created_at: input.created_at,
    countries: input.countries,
    listing_images: input.listing_images ?? (
      input.primary_image_url
        ? [{ url: input.primary_image_url, is_primary: true }]
        : []
    ),
  }
}
