import 'server-only'

export const PUBLIC_LISTING_SELECT =
  'id, slug, title, category, price, price_unit, price_visible, location_city, location_state, created_at, listing_images(url, is_primary, alt_text, sort_order), countries(name, iso_code), categories(name)'

export const PUBLIC_LISTING_SELECT_WITH_COORDS =
  `${PUBLIC_LISTING_SELECT}, latitude, longitude, states(latitude, longitude)`

/** /listings/[slug] — public-safe columns only (no AI/moderation fields). */
export const PUBLIC_LISTING_DETAIL_SELECT =
  'id, slug, title, description, category, manufacturer, model, year, condition, price, price_unit, price_visible, location_city, location_state, tags, specs, status, seller_id, organization_id, created_at, listing_images(id, url, is_primary, alt_text, sort_order, gallery_position), listing_videos(id, mux_playback_id, status, duration_seconds, gallery_position, position), countries(name, iso_code), categories(slug, name)'

export type PublicListing = {
  id: string
  slug: string | null
  title: string
  category: string
  category_name: string | null
  categories: { name: string } | null
  price: number | null
  price_unit: string
  price_visible: boolean
  location_city: string | null
  location_state: string | null
  created_at: string
  listing_images: { url: string; is_primary: boolean; alt_text: string | null }[]
  countries: { name: string; iso_code: string | null } | null
}

type PublicListingImageRow = {
  url: string
  is_primary?: boolean
  alt_text?: string | null
  sort_order?: number | null
}

type PublicListingRow = {
  id: string
  slug?: string | null
  title: string
  category: string
  price?: number | null
  price_unit?: string | null
  price_visible?: boolean | null
  location_city?: string | null
  location_state?: string | null
  created_at: string
  listing_images?: PublicListingImageRow[] | null
  countries?:
    | { name: string; iso_code: string | null }
    | { name: string; iso_code: string | null }[]
    | null
  categories?: { name: string } | { name: string }[] | null
}

function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function toPublicListing(
  row: PublicListingRow | { id: string; [key: string]: unknown },
): PublicListing {
  const source = row as PublicListingRow
  const categoriesRel = firstRel(source.categories)
  const countriesRel = firstRel(source.countries)
  const categories = categoriesRel ? { name: categoriesRel.name } : null
  const countries = countriesRel
    ? { name: countriesRel.name, iso_code: countriesRel.iso_code }
    : null
  const priceVisible = source.price_visible === true
  const price =
    priceVisible && Number(source.price) > 0 ? source.price ?? null : null

  const listing_images = [...(source.listing_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(image => ({
      url: image.url,
      is_primary: image.is_primary === true,
      alt_text: image.alt_text ?? null,
    }))

  return {
    id: source.id,
    slug: source.slug ?? null,
    title: source.title,
    category: source.category,
    category_name: categories?.name ?? null,
    categories,
    price,
    price_unit: source.price_unit ?? 'total',
    price_visible: priceVisible,
    location_city: source.location_city ?? null,
    location_state: source.location_state ?? null,
    created_at: source.created_at,
    listing_images,
    countries,
  }
}
