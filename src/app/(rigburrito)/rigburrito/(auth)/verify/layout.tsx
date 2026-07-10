import { requireAdminAuthPage } from '@/lib/rigburrito/auth'

export default async function VerifyMfaLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAuthPage()
  return children
}
