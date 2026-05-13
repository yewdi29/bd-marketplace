import DashboardNav from '@/components/layout/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
