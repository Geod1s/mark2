
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { DashboardOverview } from "@/components/dashboard/overview"
import { redirect } from "next/navigation"

// Define types
interface Order {
  id: string
  total_amount: number | string
  status: string
  created_at: string
  order_items?: Array<{
    product?: { name: string }
  }>
  type?: 'stripe' | 'cash'
  order_type?: 'stripe' | 'cash'
  vendor_id?: string
}

export default async function DashboardPage() {
  // IMPORTANT: Add 'await' here since createClient is async
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  // Fetch dashboard stats - INCLUDING CASH ORDERS - EXCLUDING CANCELLED ORDERS
  const [productsResult, stripeOrdersResult, cashOrdersResult, recentOrdersResult] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("vendor_id", vendor.id),
    supabase
      .from("orders")
      .select("id, total_amount, status")
      .eq("vendor_id", vendor.id),
    supabase
      .from("cash_orders")
      .select("id, total_amount, status")
      .eq("vendor_id", vendor.id),
    // Get recent orders (both stripe and cash)
    supabase
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .eq("vendor_id", vendor.id)
      .neq("status", "cancelled") // Exclude cancelled orders from recent list
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const totalProducts = productsResult.count || 0
  const stripeOrders: Order[] = stripeOrdersResult.data || []
  const cashOrders: Order[] = cashOrdersResult.data || []

  // Filter out cancelled orders for revenue calculation
  const activeStripeOrders = stripeOrders.filter((order: Order) => order.status !== 'cancelled')
  const activeCashOrders = cashOrders.filter((order: Order) => order.status !== 'cancelled')

  // Combine orders count (including cancelled orders in the count)
  const totalOrders = stripeOrders.length + cashOrders.length

  // Calculate total revenue from both order types (excluding cancelled orders)
  const stripeRevenue = activeStripeOrders.reduce(
    (sum: number, order: Order) => sum + (Number(order.total_amount) || 0), 
    0
  )
  const cashRevenue = activeCashOrders.reduce(
    (sum: number, order: Order) => sum + (Number(order.total_amount) || 0), 
    0
  )
  const totalRevenue = stripeRevenue + cashRevenue
  
  // Get recent cash orders too
  const { data: recentCashOrders } = await supabase
    .from("cash_orders")
    .select("*")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled") // Exclude cancelled orders from recent list
    .order("created_at", { ascending: false })
    .limit(5)

  // Combine and sort all recent orders
  const allRecentOrders = [
    ...(recentOrdersResult.data || []).map((order: any) => ({
      ...order,
      type: 'stripe' as const,
      order_type: 'stripe'
    })),
    ...(recentCashOrders || []).map((order: any) => ({
      ...order,
      type: 'cash' as const,
      order_type: 'cash',
      // Add empty order_items for consistency
      order_items: []
    }))
  ]
  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 5) // Get top 5 most recent

  // Prepare stats object matching DashboardOverviewProps
  const stats = {
    totalProducts,
    totalOrders,
    totalRevenue,
    // Add additional stats as optional properties
    stripeOrdersCount: stripeOrders.length,
    cashOrdersCount: cashOrders.length,
    stripeRevenue,
    cashRevenue,
  }

  return (
    <DashboardLayout vendor={vendor}>
      <DashboardOverview
        vendor={vendor}
        stats={stats}
        recentOrders={allRecentOrders}
      />
    </DashboardLayout>
  )
}