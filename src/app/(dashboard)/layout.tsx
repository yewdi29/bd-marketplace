import DashboardNav from '@/components/layout/DashboardNav'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { MembershipPlan } from '@/lib/types/database'
import type { ProfileUser } from '@/components/ui/ProfileDropdown'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: ProfileUser = {
    email: user?.email ?? '',
    full_name: null,
    company_name: null,
    plan: 'free',
    listing_count: 0,
    has_organization: false,
  }

  if (user) {
    const [profileRes, countRes, orgMemberRes] = await Promise.all([
      supabase.from('users').select('full_name, company_name, plan').eq('id', user.id).single(),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
      supabase.from('org_members').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    ])
    if (profileRes.data) {
      profile = {
        email: user.email ?? '',
        full_name: profileRes.data.full_name,
        company_name: profileRes.data.company_name,
        plan: profileRes.data.plan as MembershipPlan,
        listing_count: countRes.count ?? 0,
        has_organization: Boolean(orgMemberRes.data),
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <DashboardNav user={profile} />
      <main className="flex-1 pt-[64px]">
        {children}
      </main>
      <Footer />
    </div>
  )
}
