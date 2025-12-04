// import { createClient } from "@/lib/supabase/server"
// import { DashboardLayout } from "@/components/dashboard/layout"
// import { DashboardOverview } from "@/components/dashboard/overview"
// import { redirect } from "next/navigation"

// export default async function DashboardPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/dashboard")
//   }

//   const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

//   if (!vendor) {
//     redirect("/become-vendor")
//   }

//   // Fetch dashboard stats
//   const [productsResult, ordersResult, recentOrdersResult] = await Promise.all([
//     supabase.from("products").select("id", { count: "exact" }).eq("vendor_id", vendor.id),
//     supabase.from("orders").select("id, total_amount", { count: "exact" }).eq("vendor_id", vendor.id),
//     supabase
//       .from("orders")
//       .select("*, order_items(*, product:products(name))")
//       .eq("vendor_id", vendor.id)
//       .order("created_at", { ascending: false })
//       .limit(5),
//   ])

//   const totalProducts = productsResult.count || 0
//   const totalOrders = ordersResult.count || 0
//   const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
//   const recentOrders = recentOrdersResult.data || []

//   return (
//     <DashboardLayout vendor={vendor}>
//       <DashboardOverview
//         vendor={vendor}
//         stats={{
//           totalProducts,
//           totalOrders,
//           totalRevenue,
//         }}
//         recentOrders={recentOrders}
//       />
//     </DashboardLayout>
//   )
// }
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { DashboardOverview } from "@/components/dashboard/overview"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  // Fetch dashboard stats - INCLUDING CASH ORDERS
  const [productsResult, stripeOrdersResult, cashOrdersResult, recentOrdersResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact" }).eq("vendor_id", vendor.id),
    supabase.from("orders").select("id, total_amount").eq("vendor_id", vendor.id),
    supabase.from("cash_orders").select("id, total_amount").eq("vendor_id", vendor.id),
    // Get recent orders (both stripe and cash)
    supabase
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const totalProducts = productsResult.count || 0
  const stripeOrders = stripeOrdersResult.data || []
  const cashOrders = cashOrdersResult.data || []
  
  // Combine orders count
  const totalOrders = stripeOrders.length + cashOrders.length
  
  // Calculate total revenue from both order types
  const stripeRevenue = stripeOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
  const cashRevenue = cashOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
  const totalRevenue = stripeRevenue + cashRevenue
  
  // Get recent cash orders too
  const { data: recentCashOrders } = await supabase
    .from("cash_orders")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Combine and sort all recent orders
  const allRecentOrders = [
    ...(recentOrdersResult.data || []).map(order => ({
      ...order,
      type: 'stripe' as const,
      order_type: 'stripe'
    })),
    ...(recentCashOrders || []).map(order => ({
      ...order,
      type: 'cash' as const,
      order_type: 'cash',
      // Add empty order_items for consistency
      order_items: []
    }))
  ]
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 5) // Get top 5 most recent

  // Prepare stats object matching DashboardOverviewProps
  const stats = {
    totalProducts,
    totalOrders,
    totalRevenue,
    // Add additional stats as optional properties
    stripeOrdersCount: stripeOrders.length,
    cashOrdersCount: cashOrders.length,
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