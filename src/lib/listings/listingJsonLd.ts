/**
 * Listing detail Product / Offer JSON-LD builders.
 * Contact-for-price listings must never emit a numeric Offer.price
 * (matches visible UI + OG via formatPrice).
 */

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
 * Price-on-request pattern (when price is hidden / zero):
 * - Offer retained (url, availability, priceCurrency)
 * - numeric `price` omitted entirely
 * - `priceSpecification` with description "Price on request" and no amount fields
 *   (schema.org PriceSpecification; avoids contradicting visible "Contact for price")
 */
export function buildListingProductJsonLd(input: BuildListingProductJsonLdInput) {
  const contactForPrice = isContactForPriceListing(input.price, input.priceVisible)
  const imageUrls = sortedImageUrls(input.images)
  const itemCondition = mapListingItemCondition(input.condition)

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: input.listingUrl,
    priceCurrency: 'USD',
    availability: input.isSold
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock',
  }

  if (contactForPrice) {
    // Legitimate "price on request" signal — never emit a numeric price.
    offer.priceSpecification = {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      description: 'Price on request',
    }
  } else {
    offer.price = input.price
  }

  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    offers: offer,
    category: input.categoryLabel,
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
