// import { createClient } from "@/lib/supabase/server"
// import { Header } from "@/components/header"
// import { Footer } from "@/components/footer"
// import { redirect } from "next/navigation"
// import Link from "next/link"
// import { Package } from "lucide-react"

// export default async function OrdersPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/orders")
//   }

//   const { data: orders } = await supabase
//     .from("orders")
//     .select("*, vendor:vendors(store_name, slug), order_items(*, product:products(name, images))")
//     .eq("user_id", user.id)
//     .order("created_at", { ascending: false })

//   const statusColors: Record<string, string> = {
//     pending: "bg-yellow-500/10 text-yellow-500",
//     processing: "bg-blue-500/10 text-blue-500",
//     shipped: "bg-purple-500/10 text-purple-500",
//     delivered: "bg-green-500/10 text-green-500",
//     cancelled: "bg-red-500/10 text-red-500",
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-background">
//       <Header />
//       <main className="flex-1">
//         <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
//           <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
//           <p className="mt-1 text-muted-foreground">Track and manage your purchases</p>

//           {orders && orders.length > 0 ? (
//             <div className="mt-8 space-y-4">
//               {orders.map((order) => (
//                 <div key={order.id} className="rounded-lg border border-border bg-card overflow-hidden">
//                   <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
//                     <div className="flex items-center gap-4">
//                       <div>
//                         <p className="text-sm text-muted-foreground">Order</p>
//                         <p className="font-mono font-medium">#{order.id.slice(0, 8)}</p>
//                       </div>
//                       <div className="hidden sm:block">
//                         <p className="text-sm text-muted-foreground">Date</p>
//                         <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
//                       </div>
//                       <div className="hidden sm:block">
//                         <p className="text-sm text-muted-foreground">Vendor</p>
//                         <Link href={`/vendors/${order.vendor?.slug}`} className="font-medium hover:underline">
//                           {order.vendor?.store_name}
//                         </Link>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <span
//                         className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[order.status]}`}
//                       >
//                         {order.status}
//                       </span>
//                       <p className="mt-1 font-semibold">${Number(order.total_amount).toFixed(2)}</p>
//                     </div>
//                   </div>

//                   <div className="p-4">
//                     <div className="space-y-3">
//                       {order.order_items?.map((item: any) => (
//                         <div key={item.id} className="flex items-center gap-3">
//                           <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
//                             <img
//                               src={
//                                 item.product?.images?.[0] ||
//                                 `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(item.product_name)}`
//                               }
//                               alt={item.product_name}
//                               className="h-full w-full object-cover"
//                             />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="font-medium truncate">{item.product_name}</p>
//                             <p className="text-sm text-muted-foreground">
//                               {item.quantity} x ${Number(item.unit_price).toFixed(2)}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
//               <Package className="h-12 w-12 text-muted-foreground/50" />
//               <p className="mt-4 text-muted-foreground">No orders yet</p>
//               <Link href="/products" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
//                 Start shopping
//               </Link>
//             </div>
//           )}
//         </div>
//       </main>
//       <Footer />
//     </div>
//   )
// }

//// v2 ////

import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, DollarSign, CreditCard } from "lucide-react"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/orders")
  }

  // Fetch regular Stripe orders
  const { data: stripeOrders } = await supabase
    .from("orders")
    .select("*, vendor:vendors(store_name, slug), order_items(*, product:products(name, images))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch cash orders
  const { data: cashOrders } = await supabase
    .from("cash_orders")
    .select("*, vendor:vendors(store_name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Combine and sort all orders by date
  const allOrders = [
    ...(stripeOrders || []).map(order => ({
      ...order,
      type: 'stripe' as const,
      payment_type: 'card',
      payment_icon: <CreditCard className="h-3 w-3" />
    })),
    ...(cashOrders || []).map(order => ({
      ...order,
      type: 'cash' as const,
      payment_type: order.payment_method || 'cash',
      payment_icon: <DollarSign className="h-3 w-3" />,
      // Add empty order_items array for consistency
      order_items: []
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    processing: "bg-blue-500/10 text-blue-500",
    confirmed: "bg-blue-500/10 text-blue-500",
    shipped: "bg-purple-500/10 text-purple-500",
    delivered: "bg-green-500/10 text-green-500",
    paid: "bg-green-500/10 text-green-500",
    cancelled: "bg-red-500/10 text-red-500",
  }

  const getCashOrderItems = (order: any) => {
    if (order.type === 'cash' && order.items) {
      try {
        return Array.isArray(order.items) ? order.items : JSON.parse(order.items)
      } catch {
        return []
      }
    }
    return []
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
          <p className="mt-1 text-muted-foreground">Track and manage your purchases</p>

          {allOrders.length > 0 ? (
            <div className="mt-8 space-y-4">
              {allOrders.map((order) => {
                const orderItems = order.type === 'stripe' 
                  ? order.order_items 
                  : getCashOrderItems(order)
                
                return (
                  <div key={order.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-secondary/30">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-medium">#{order.id.slice(0, 8)}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${order.type === 'cash' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {order.payment_icon}
                              {order.type === 'cash' ? 'Cash' : 'Card'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vendor</p>
                          <Link 
                            href={`/vendors/${order.vendor?.slug}`} 
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {order.vendor?.store_name}
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
                        >
                          {order.status}
                        </span>
                        <p className="mt-1 font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      {orderItems.length > 0 ? (
                        <div className="space-y-3">
                          {orderItems.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                                <img
                                  src={
                                    item.product?.images?.[0] ||
                                    (order.type === 'stripe' && item.product?.images?.[0]) ||
                                    `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(item.product_name || item.name || 'Product')}`
                                  }
                                  alt={item.product_name || item.name || 'Product'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product_name || item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} x ${Number(item.unit_price || item.price || 0).toFixed(2)}
                                </p>
                                {order.type === 'cash' && item.vendor_name && (
                                  <p className="text-xs text-muted-foreground">Vendor: {item.vendor_name}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No item details available</p>
                      )}

                      {/* Cash Order Specific Info */}
                      {order.type === 'cash' && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-medium mb-2">Cash Order Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Delivery Address</p>
                              <p className="font-medium">{order.delivery_address}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Contact Info</p>
                              <p className="font-medium">{order.customer_email}</p>
                              {order.customer_phone && (
                                <p className="text-muted-foreground">{order.customer_phone}</p>
                              )}
                            </div>
                          </div>
                          
                          {order.special_instructions && (
                            <div className="mt-3 p-3 bg-secondary/50 rounded-md">
                              <p className="text-sm">
                                <span className="font-medium">Special Instructions:</span> {order.special_instructions}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              <strong>Payment Status:</strong> {order.status === 'paid' ? 'Paid' : 'Pending Payment'}
                              <br />
                              <span className="text-xs">
                                For cash orders, the vendor will contact you for payment and delivery arrangements.
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Stripe Order Specific Info */}
                      {order.type === 'stripe' && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="text-sm text-muted-foreground">
                            <p>Payment processed via Stripe</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No orders yet</p>
              <Link href="/products" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
                Start shopping
              </Link>
            </div>
          )}

          {/* Order Type Summary */}
          {allOrders.length > 0 && (
            <div className="mt-8 p-4 bg-card border border-border rounded-lg">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <span>Total Orders</span>
                  <span className="font-semibold">{allOrders.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Card Payments
                  </span>
                  <span className="font-semibold">
                    {allOrders.filter(o => o.type === 'stripe').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Cash Orders
                  </span>
                  <span className="font-semibold">
                    {allOrders.filter(o => o.type === 'cash').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}