/**
 * Listing detail Product / Offer JSON-LD builders.
 * Contact-for-price listings must never emit a numeric Offer.price
 * (matches visible UI + OG via formatPrice).
 */

import { PUBLIC_SITE_URL } from '@/lib/site'

export type ListingJsonLdImage = {
  url: string
  sort_order?: number | null
}

/** Same visibility rule as formatPrice / listing UI. */
export function isContactForPriceListing(
  price: number,
  priceVisible: boolean,
): boolean {
  return !priceVisible || !price || price === 0
}

/**
 * Map BD listing condition → schema.org OfferItemCondition.
 * https://schema.org/OfferItemCondition
 */
export function mapListingItemCondition(
  condition: string | null | undefined,
): string | undefined {
  if (!condition) return undefined
  switch (condition) {
    case 'new':
      return 'https://schema.org/NewCondition'
    case 'parts_only':
      return 'https://schema.org/DamagedCondition'
    case 'like_new':
    case 'good':
    case 'fair':
      return 'https://schema.org/UsedCondition'
    default:
      return 'https://schema.org/UsedCondition'
  }
}

function sortedImageUrls(images: ListingJsonLdImage[] | null | undefined): string[] {
  if (!images?.length) return []
  return [...images]
    .filter(img => Boolean(img.url))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(img => img.url)
}

export interface BuildListingProductJsonLdInput {
  title: string
  description: string | null | undefined
  listingUrl: string
  price: number
  priceVisible: boolean
  isSold: boolean
  manufacturer: string | null | undefined
  condition: string | null | undefined
  categoryLabel: string
  images: ListingJsonLdImage[] | null | undefined
}

/**
 * Product + Offer JSON-LD for /listings/[slug].
 *
 * Contact-for-price (hidden / zero): omit `offers` entirely so Google does not
 * see an Offer without a price. Numeric prices keep a standard Offer.
 */
export function buildListingProductJsonLd(input: BuildListingProductJsonLdInput) {
  const contactForPrice = isContactForPriceListing(input.price, input.priceVisible)
  const imageUrls = sortedImageUrls(input.images)
  const itemCondition = mapListingItemCondition(input.condition)

  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    category: input.categoryLabel,
  }

  if (!contactForPrice) {
    product.offers = {
      '@type': 'Offer',
      url: input.listingUrl,
      priceCurrency: 'USD',
      availability: input.isSold
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      price: input.price,
    }
  }

  if (input.description) {
    product.description = input.description
  }
  if (imageUrls.length === 1) {
    product.image = imageUrls[0]
  } else if (imageUrls.length > 1) {
    product.image = imageUrls
  }
  if (input.manufacturer) {
    product.brand = {
      '@type': 'Brand',
      name: input.manufacturer,
    }
  }
  if (itemCondition) {
    product.itemCondition = itemCondition
  }

  return product
}

export function buildListingBreadcrumbJsonLd(input: {
  listingUrl: string
  title: string
  categoryLabel: string
  categoryPath: string
}) {
  const categoryUrl = input.categoryPath.startsWith('http')
    ? input.categoryPath
    : `${PUBLIC_SITE_URL}${input.categoryPath}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Browse',
        item: `${PUBLIC_SITE_URL}/search`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: input.categoryLabel,
        item: categoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: input.title,
        item: input.listingUrl,
      },
    ],
  }
}
