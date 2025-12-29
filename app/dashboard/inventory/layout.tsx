import { ReactNode } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'

interface InventoryLayoutProps {
  children: ReactNode
}

export default function InventoryLayout({ children }: InventoryLayoutProps) {
  // This layout will be applied to all routes in the /dashboard/inventory directory
  return (
    <div className="flex h-full w-full flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Inventory Management</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}