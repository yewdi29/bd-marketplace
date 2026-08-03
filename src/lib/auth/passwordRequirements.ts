/** Matches Supabase Auth password policy: min 8 + lower + upper + digits + symbols. */

export type PasswordChecks = {
  minLength: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  symbol: boolean
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

export const PASSWORD_REQUIREMENT_LABELS: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'lowercase', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'symbol', label: 'One symbol' },
]

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function passwordMeetsRequirements(password: string): boolean {
  const checks = getPasswordChecks(password)
  return Object.values(checks).every(Boolean)
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak'
  const met = Object.values(getPasswordChecks(password)).filter(Boolean).length
  if (met <= 1) return 'weak'
  if (met === 2) return 'fair'
  if (met <= 4) return 'good'
  return 'strong'
}

export const PASSWORD_STRENGTH_META: Record<
  PasswordStrength,
  { label: string; barClass: string; textClass: string; segments: number }
> = {
  weak: { label: 'Weak', barClass: 'bg-red-500', textClass: 'text-red-600', segments: 1 },
  fair: { label: 'Fair', barClass: 'bg-amber-500', textClass: 'text-amber-600', segments: 2 },
  good: { label: 'Good', barClass: 'bg-lime-600', textClass: 'text-lime-700', segments: 3 },
  strong: { label: 'Strong', barClass: 'bg-green-600', textClass: 'text-green-700', segments: 4 },
}
