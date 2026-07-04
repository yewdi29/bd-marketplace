/** Clears all MFA factors via admin API (server-side only, used during setup recovery). */
export async function resetMfaFactors(): Promise<{ removed: number }> {
  const res = await fetch('/api/rigburrito/mfa/reset', { method: 'POST' })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to reset MFA')
  }

  return { removed: data.removed ?? 0 }
}
