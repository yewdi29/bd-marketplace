import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canonicalUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description:
    'Choose a Black Diamond Marketplace membership plan. List heavy equipment, reach verified buyers, and grow your business globally.',
  alternates: { canonical: canonicalUrl('/dashboard/upgrade') },
}

export default async function UpgradeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (orgMember) {
      redirect('/dashboard/organization?tab=billing')
    }
  }

  return children
}
