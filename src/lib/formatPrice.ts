const PRICE_UNITS: Record<string, string> = {
  total: '',
  per_foot: ' / ft',
  per_piece: ' / piece',
  per_ton: ' / ton',
  per_set: ' / set',
  per_meter: ' / m',
}

/** Format a price input string with thousand separators (e.g. "1500000" → "1,500,000"). */
export function formatPriceInputValue(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const firstDot = cleaned.indexOf('.')
  const intRaw = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot)
  const decRaw = firstDot === -1 ? undefined : cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)

  // Preserve a lone leading "0" while typing decimals (e.g. "0.5")
  const intDigits = intRaw.replace(/^0+(?=\d)/, '') || (decRaw !== undefined ? '0' : intRaw)
  const withCommas = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return decRaw !== undefined ? `${withCommas}.${decRaw}` : withCommas
}

/** Parse a comma-formatted price input into a number. */
export function parsePriceInputValue(formatted: string): number {
  const n = parseFloat(formatted.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Format a numeric price for display in an editable input. */
export function formatPriceNumberForInput(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return ''
  return formatPriceInputValue(String(price))
}

export function formatPriceAmount(price: number, priceUnit: string): string {
  const cents = Math.round(Math.abs(price) * 100) % 100
  const hasCents = cents !== 0
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
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
