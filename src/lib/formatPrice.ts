const PRICE_UNITS: Record<string, string> = {
  total: '',
  per_foot: ' / ft',
  per_piece: ' / piece',
  per_ton: ' / ton',
  per_set: ' / set',
  per_meter: ' / m',
}

export function formatPriceAmount(price: number, priceUnit: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  return formatted + (PRICE_UNITS[priceUnit] ?? '')
}

/** Admin listings table — always shows amount; brackets when hidden from buyers. */
export function formatAdminTablePrice(price: number, priceUnit: string, priceVisible: boolean): string {
  const amount = formatPriceAmount(price, priceUnit)
  return priceVisible ? amount : `[ ${amount} ]`
}

export function formatPrice(price: number, priceUnit: string, priceVisible: boolean): string {
  if (!priceVisible) return 'Contact for price'
  if (!price || price === 0) return 'Contact for price'
  return formatPriceAmount(price, priceUnit)
}
