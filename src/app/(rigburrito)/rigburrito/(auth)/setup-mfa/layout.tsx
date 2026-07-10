import { requireAdminAuthPage } from '@/lib/rigburrito/auth'

export default async function SetupMfaLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAuthPage()
  return children
}
