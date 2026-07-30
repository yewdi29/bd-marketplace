/** Shared membership tier copy — pricing page and in-app upgrade use the same lists. */

export interface TierFeature {
  label: string
  included: boolean
}

export type PaidTierId = 'starter' | 'pro' | 'max'

export interface PaidMembershipTier {
  id: PaidTierId
  name: string
  monthly: number
  annualPerMonth: number
  annualTotal: number
  annualSavings: number
  listingLabel: string
  popular: boolean
  features: TierFeature[]
}

export const FREE_TIER_FEATURES: TierFeature[] = [
  { label: '3 active listings', included: true },
  { label: 'AI listing generation', included: true },
  { label: 'Video upload', included: true },
  { label: 'BD Verified badge', included: false },
  { label: 'Business Directory Access', included: false },
]

export const PAID_MEMBERSHIP_TIERS: PaidMembershipTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 299,
    annualPerMonth: 267,
    annualTotal: 3200,
    annualSavings: 388,
    listingLabel: '15 listings',
    popular: false,
    features: [
      { label: '15 active listings', included: true },
      { label: 'AI listing generation', included: true },
      { label: 'BD Verified badge', included: true },
      { label: 'Video upload', included: true },
      { label: 'Business Directory Access', included: true },
      { label: 'Monthly analytics report', included: false },
      { label: '1 newsletter feature/week', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 699,
    annualPerMonth: 625,
    annualTotal: 7500,
    annualSavings: 888,
    listingLabel: '40 listings',
    popular: true,
    features: [
      { label: 'Everything in Starter, plus:', included: true },
      { label: '40 active listings', included: true },
      { label: 'Monthly analytics report', included: true },
      { label: '1 newsletter feature/week', included: true },
      { label: 'Exclusive newsletter blast', included: false },
      { label: 'Home Page Partner Spotlight', included: false },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    monthly: 999,
    annualPerMonth: 917,
    annualTotal: 11000,
    annualSavings: 988,
    listingLabel: 'Unlimited',
    popular: false,
    features: [
      { label: 'Everything in Pro, plus:', included: true },
      { label: 'Unlimited listings', included: true },
      { label: 'Exclusive newsletter blast (monthly)', included: true },
      { label: 'Business Directory priority placement', included: true },
      { label: 'Home Page Partner Spotlight', included: true },
      { label: 'Priority support', included: true },
    ],
  },
]

export const ENTERPRISE_TIER_FEATURES = [
  'Everything in Max, plus:',
  '5 seats included, additional seats available',
  'Multi-location / multi-branch team support',
  'Owner and Manager roles with organization-wide visibility',
  'Dedicated account manager',
] as const
