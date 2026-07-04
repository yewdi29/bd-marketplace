import { requireAdminLayout } from '@/lib/rigburrito/auth'
import AdminSidebar from '@/components/rigburrito/AdminSidebar'

export default async function RigburritoAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminLayout()

  return (
    <div className="rigburrito-shell">
      <AdminSidebar />
      <main className="rigburrito-main">
        <div className="rigburrito-page">
          {children}
        </div>
      </main>
    </div>
  )
}
