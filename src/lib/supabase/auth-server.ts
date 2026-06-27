import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/** Dedupes auth.getUser() within a single server request (layout + page). */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
