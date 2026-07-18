/** Version slug — bump when legal publishes new Enterprise terms (Section 10 of /terms). */
export const ENTERPRISE_TERMS_VERSION = '2026-07-placeholder-v1'

/** Anchor id on /terms Section 10 — Enterprise Organizations. */
export const ENTERPRISE_TERMS_SECTION_ID = 'enterprise-organizations'

export const ENTERPRISE_TERMS_PATH = `/terms#${ENTERPRISE_TERMS_SECTION_ID}`

export function getEnterpriseTermsUrl(appUrl?: string): string {
  const base = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}${ENTERPRISE_TERMS_PATH}`
}
