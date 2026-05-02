import type { ListingTier } from './types/database'

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`
  }
  return `$${price.toLocaleString()}`
}

export function getTierLabel(tier: ListingTier): string {
  switch (tier) {
    case 'green': return 'Under $100K'
    case 'yellow': return '$100K–$500K'
    case 'red': return 'Over $500K'
  }
}

export function getTierColor(tier: ListingTier): string {
  switch (tier) {
    case 'green': return '#22C55E'
    case 'yellow': return '#EAB308'
    case 'red': return '#EF4444'
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
