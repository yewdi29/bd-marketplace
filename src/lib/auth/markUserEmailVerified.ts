import { createServiceClient } from '@/lib/rigburrito/service'

/**
 * Stamp public.users.email_verified_at once email confirmation succeeds.
 * Idempotent — does not overwrite an existing timestamp.
 */
export async function markUserEmailVerified(
  userId: string,
  verifiedAt?: string | null,
): Promise<void> {
  const service = createServiceClient()
  const at = verifiedAt?.trim() || new Date().toISOString()

  const { error } = await service
    .from('users')
    .update({
      email_verified_at: at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .is('email_verified_at', null)

  if (error) {
    throw new Error(error.message)
  }
}
