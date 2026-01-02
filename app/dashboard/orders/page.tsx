import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { OrdersList } from "@/components/dashboard/orders-list"
import { redirect } from "next/navigation"

// Define a more complete Order interface that matches OrderWithItems
interface Order {
  id: string
  user_id: string | null
  vendor_id: string
  status: string
  total_amount: number | string
  created_at: string
  updated_at: string
  shipping_address: any
  customer_name: string
  customer_email: string | null
  payment_method: string
  order_items?: any[]
  order_type?: 'stripe' | 'cash'
}

export default async function OrdersPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/orders")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

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

  const stripeOrders: any[] = stripeOrdersResult.data || []
  const cashOrders: any[] = cashOrdersResult.data || []

  // Combine all orders - ensure all required fields are present
  const allOrders = [
    ...stripeOrders.map((order: any) => ({
      ...order,
      order_type: 'stripe' as const,
      // Ensure all required fields exist
      user_id: order.user_id || null,
      payment_method: order.payment_method || 'stripe',
      order_items: order.order_items || [],
    })),
    ...cashOrders.map((order: any) => ({
      ...order,
      order_type: 'cash' as const,
      // Map cash order fields to match expected structure
      user_id: order.user_id || null,
      payment_method: 'cash',
      order_items: [],
      // Add any missing fields that cash_orders might not have
      updated_at: order.updated_at || order.created_at,
      shipping_address: order.shipping_address || {},
      customer_name: order.customer_name || 'Cash Customer',
      customer_email: order.customer_email || null,
    }))
  ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <DashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">All Orders</h2>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>

        <OrdersList orders={allOrders} />
      </div>
    </DashboardLayout>
  )
}