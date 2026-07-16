import { Suspense } from 'react'
import { DashboardSettingsShell } from '@/components/dashboard/DashboardSettingsShell'
import OrganizationPageClient from '@/components/organizations/OrganizationPageClient'

export default function OrganizationPage() {
  return (
    <Suspense
      fallback={(
        <DashboardSettingsShell>
          <div className="text-sm text-ink-3">Loading…</div>
        </DashboardSettingsShell>
      )}
    >
      <OrganizationPageClient />
    </Suspense>
  )
}
