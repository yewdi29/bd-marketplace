import { getMuxClient } from '@/lib/mux/client'

/** Deletes a Mux asset; tolerates 404 when already removed (idempotent). */
export async function deleteMuxAsset(assetId: string): Promise<void> {
  try {
    await getMuxClient().video.assets.delete(assetId)
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status?: number }).status
        : undefined
    const message = err instanceof Error ? err.message : String(err)

    if (status === 404 || message.toLowerCase().includes('not found')) {
      return
    }

    throw err
  }
}
