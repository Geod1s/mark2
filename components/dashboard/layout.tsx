// "use client"

// import type React from "react"

// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"
// import { useRouter } from "next/navigation"
// import type { Vendor } from "@/lib/types"
// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { LayoutDashboard, Package, ShoppingCart, Settings, Store, LogOut, CreditCard, Menu, X } from "lucide-react"
// import { useState } from "react"

// interface DashboardLayoutProps {
//   vendor: Vendor
//   children: React.ReactNode
// }

// const navigation = [
//   { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
//   { name: "Products", href: "/dashboard/products", icon: Package },
//   { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
//   { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
//   { name: "Settings", href: "/dashboard/settings", icon: Settings },
//   {
//   title: "Point of Sale",
//   href: "/dashboard/pos",
//   icon: ShoppingCart,
//   description: "Quick in-person sales",
// }
// ]

// export function DashboardLayout({ vendor, children }: DashboardLayoutProps) {
//   const pathname = usePathname()
//   const router = useRouter()
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   const handleSignOut = async () => {
//     const supabase = createClient()
//     await supabase.auth.signOut()
//     router.push("/")
//     router.refresh()
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Mobile sidebar backdrop */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={cn(
//           "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0",
//           sidebarOpen ? "translate-x-0" : "-translate-x-full",
//         )}
//       >
//         <div className="flex h-full flex-col">
//           {/* Logo */}
//           <div className="flex h-16 items-center justify-between px-6 border-b border-border">
//             <Link href="/" className="flex items-center gap-2">
//               <Store className="h-6 w-6" />
//               <span className="font-semibold">Marketplace</span>
//             </Link>
//             <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
//               <X className="h-5 w-5" />
//             </Button>
//           </div>

//           {/* Vendor info */}
//           <div className="px-6 py-4 border-b border-border">
//             <p className="font-medium truncate">{vendor.store_name}</p>
//             <p className="text-sm text-muted-foreground truncate">@{vendor.slug}</p>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 px-3 py-4 space-y-1">
//             {navigation.map((item) => {
//               const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

//               return (
//                 <Link
//                   key={item.name}
//                   href={item.href}
//                   className={cn(
//                     "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
//                     isActive
//                       ? "bg-secondary text-foreground"
//                       : "text-muted-foreground hover:bg-secondary hover:text-foreground",
//                   )}
//                   onClick={() => setSidebarOpen(false)}
//                 >
//                   <item.icon className="h-5 w-5" />
//                   {item.name}
//                 </Link>
//               )
//             })}
//           </nav>

//           {/* Footer */}
//           <div className="px-3 py-4 border-t border-border space-y-1">
//             <Link
//               href={`/vendors/${vendor.slug}`}
//               className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
//             >
//               <Store className="h-5 w-5" />
//               View Store
//             </Link>
//             <button
//               onClick={handleSignOut}
//               className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
//             >
//               <LogOut className="h-5 w-5" />
//               Sign Out
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main content */}
//       <div className="lg:pl-64">
//         {/* Top bar */}
//         <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6">
//           <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
//             <Menu className="h-5 w-5" />
//           </Button>
//           <h1 className="text-lg font-semibold">Vendor Dashboard</h1>
//         </header>

//         {/* Page content */}
//         <main className="p-4 sm:p-6 lg:p-8">{children}</main>
//       </div>
//     </div>
//   )
// }
// components/dashboard/layout.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Menu,
  LogOut,
  User,
  DollarSign,
  BarChart,
  Users
} from "lucide-react"
import type { Vendor } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  vendor: Vendor
}

const navigation = [
  {
    id: "dashboard", // Unique ID
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview of your store",
  },
  {
    id: "products",
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
    description: "Manage your products",
  },
  {
    id: "orders",
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    description: "View customer orders",
  },
  {
    id: "pos",
    name: "Point of Sale",
    href: "/dashboard/pos",
    icon: CreditCard,
    description: "Quick in-person sales",
  },
  // {
  //   id: "payments",
  //   name: "Payments",
  //   href: "/dashboard/payments",
  //   icon: DollarSign,
  //   description: "Payment setup & history",
  // },
  {
    id: "analytics",
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
    description: "Sales reports & insights",
  },
  // {
  //   id: "inventory",
  //   name: "Inventory",
  //   href: "/dashboard/inventory",
  //   icon: Package,
  //   description: "Manage your inventory",
  // },
  // {
  //   id: "customers",
  //   name: "Customers",
  //   href: "/dashboard/customers",
  //   icon: Users,
  //   description: "Customer management",
  // },
  {
    id: "settings",
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "POS configuration",
  },

  {
    id: "logout",
    name: "Log out",
    href: "/dashboard/logout",
    icon: LogOut,
    description: "Sign out of your account",
  }

]

export function DashboardLayout({ children, vendor }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Avatar className="h-8 w-8">
                <AvatarImage src={vendor.logo_url || undefined} alt={vendor.store_name} />
                <AvatarFallback>{vendor.store_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[120px]">{vendor.store_name}</span>
            </Link>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="left" className="w-64 p-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={vendor.logo_url || undefined} alt={vendor.store_name} />
                      <AvatarFallback>{vendor.store_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold truncate">{vendor.store_name}</p>
                      <p className="text-xs text-muted-foreground">Vendor Dashboard</p>
                    </div>
                  </div>
                </div>
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.id} // Use unique ID as key
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary",
                          pathname === item.href
                            ? "bg-secondary text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
   <div className="flex flex-col flex-1 border-r bg-card">
    <div className="flex h-16 items-center justify-between border-b px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Avatar className="h-8 w-8">
          <AvatarImage src={vendor.logo_url || undefined} alt={vendor.store_name} />
          <AvatarFallback>{vendor.store_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="truncate">{vendor.store_name}</span>
      </Link>
    </div>

    <ScrollArea className="flex-1 ">
      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors     ",
                  pathname === item.href
                  ? " bg-accent text-white rounded-lg ps "
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.name}</p>
                  <p className="text-xs truncate">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </ScrollArea>

    <div className="border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start hover:bg-secondary">
            <Avatar className="h-8 w-8 text-muted-foreground mr-2">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground truncate">{vendor.store_name}</p>
              <p className="text-xs text-muted-foreground truncate">POS Account</p>
            </div>
          </Button>
        </DropdownMenuTrigger>

        {/* Dropdown styling to prevent color change on hover/focus */}
        <DropdownMenuContent align="end" className="w-56 bg-black text-white border-zinc-800">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />

          <DropdownMenuItem
            asChild
            className="focus:bg-transparent focus:text-white cursor-pointer"
          >
            <Link href="/dashboard/settings" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="focus:bg-transparent focus:text-white cursor-pointer"
          >
            <Link href="/" className="flex w-full items-center">
              <Home className="mr-2 h-4 w-4" />
              Storefront
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-zinc-800" />

          <DropdownMenuItem
            asChild
            className="focus:bg-transparent focus:text-white cursor-pointer"
          >
            <Link href="/dashboard/logout" className="flex w-full items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <div className="lg:h-16" /> {/* Spacer for fixed sidebar */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}