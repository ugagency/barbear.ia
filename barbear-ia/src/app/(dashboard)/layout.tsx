import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex min-h-screen sticky top-0" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
