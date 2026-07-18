import type { EnterpriseBillingInterval } from '@/lib/stripe/enterpriseConfig'

export function getEnterpriseBasePriceCents(interval: EnterpriseBillingInterval): number {
  if (interval === 'annual') {
    return Number(process.env.ENTERPRISE_BASE_ANNUAL_CENTS ?? 1_499_000)
  }
  return Number(process.env.ENTERPRISE_BASE_MONTHLY_CENTS ?? 149_900)
}

export function getEnterprisePerSeatPriceCents(interval: EnterpriseBillingInterval): number {
  if (interval === 'annual') {
    return Number(process.env.ENTERPRISE_PER_SEAT_ANNUAL_CENTS ?? 99_000)
  }
  return Number(process.env.ENTERPRISE_PER_SEAT_MONTHLY_CENTS ?? 9_900)
}

export function formatEnterprisePrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function enterpriseBillingIntervalLabel(interval: EnterpriseBillingInterval): string {
  return interval === 'annual' ? 'Annual' : 'Monthly'
}
