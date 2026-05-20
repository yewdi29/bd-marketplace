export function formatPrice(price: number, priceUnit: string, priceVisible: boolean): string {
  if (!priceVisible) return 'Contact for price'
  if (!price || price === 0) return 'Contact for price'
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  const units: Record<string, string> = {
    total: '',
    per_foot: ' / ft',
    per_piece: ' / piece',
    per_ton: ' / ton',
    per_set: ' / set',
    per_meter: ' / m',
  }
  return formatted + (units[priceUnit] ?? '')
}
