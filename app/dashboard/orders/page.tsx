// import { createClient } from "@/lib/supabase/server"
// import { DashboardLayout } from "@/components/dashboard/layout"
// import { OrdersList } from "@/components/dashboard/orders-list"
// import { redirect } from "next/navigation"

// export default async function OrdersPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/dashboard/orders")
//   }

//   const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

//   if (!vendor) {
//     redirect("/become-vendor")
//   }

//   const { data: orders } = await supabase
//     .from("orders")
//     .select("*, order_items(*, product:products(name, images))")
//     .eq("vendor_id", vendor.id)
//     .order("created_at", { ascending: false })

//   return (
//     <DashboardLayout vendor={vendor}>
//       <div className="space-y-6">
//         <div>
//           <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
//           <p className="text-muted-foreground">Manage customer orders</p>
//         </div>

//         <OrdersList orders={orders || []} />
//       </div>
//     </DashboardLayout>
//   )
// }
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { OrdersList } from "@/components/dashboard/orders-list"
import { redirect } from "next/navigation"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/orders")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  // Fetch both stripe and cash orders
  const [stripeOrdersResult, cashOrdersResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*, product:products(name, images))")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cash_orders")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
  ])

  const stripeOrders = stripeOrdersResult.data || []
  const cashOrders = cashOrdersResult.data || []

  // Combine all orders
  const allOrders = [
    ...stripeOrders.map(order => ({
      ...order,
      order_type: 'stripe' as const
    })),
    ...cashOrders.map(order => ({
      ...order,
      order_type: 'cash' as const,
      // Add empty order_items for consistency
      order_items: []
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <DashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">All Orders</h2>
          <p className="text-muted-foreground">Manage customer orders (Stripe & Cash)</p>
        </div>

        <OrdersList orders={allOrders} />
      </div>
    </DashboardLayout>
  )
}