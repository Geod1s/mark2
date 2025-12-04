// "use client"

// import { useState } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import type { Order, OrderItem, Product } from "@/lib/types"
// import { ShoppingCart } from "lucide-react"

// type OrderWithItems = Order & {
//   order_items: (OrderItem & { product: Pick<Product, "name" | "images"> | null })[]
// }

// interface OrdersListProps {
//   orders: OrderWithItems[]
// }

// const statusColors: Record<string, string> = {
//   pending: "bg-yellow-500/10 text-yellow-500",
//   processing: "bg-blue-500/10 text-blue-500",
//   shipped: "bg-purple-500/10 text-purple-500",
//   delivered: "bg-green-500/10 text-green-500",
//   cancelled: "bg-red-500/10 text-red-500",
// }

// export function OrdersList({ orders: initialOrders }: OrdersListProps) {
//   const [orders, setOrders] = useState(initialOrders)
//   const [updating, setUpdating] = useState<string | null>(null)

//   const updateOrderStatus = async (orderId: string, status: string) => {
//     setUpdating(orderId)
//     const supabase = createClient()

//     const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

//     if (!error) {
//       setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: status as Order["status"] } : order)))
//     }

//     setUpdating(null)
//   }

//   if (orders.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
//         <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
//         <p className="mt-4 text-muted-foreground">No orders yet</p>
//         <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers make purchases</p>
//       </div>
//     )
//   }

//   return (
//     <div className="rounded-lg border border-border bg-card overflow-hidden">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Order ID</TableHead>
//             <TableHead>Items</TableHead>
//             <TableHead>Total</TableHead>
//             <TableHead>Status</TableHead>
//             <TableHead>Date</TableHead>
//             <TableHead>Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {orders.map((order) => (
//             <TableRow key={order.id}>
//               <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
//               <TableCell>
//                 <div className="space-y-1">
//                   {order.order_items.slice(0, 2).map((item) => (
//                     <p key={item.id} className="text-sm">
//                       {item.quantity}x {item.product?.name || item.product_name}
//                     </p>
//                   ))}
//                   {order.order_items.length > 2 && (
//                     <p className="text-sm text-muted-foreground">+{order.order_items.length - 2} more</p>
//                   )}
//                 </div>
//               </TableCell>
//               <TableCell className="font-medium">${Number(order.total_amount).toFixed(2)}</TableCell>
//               <TableCell>
//                 <span
//                   className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[order.status]}`}
//                 >
//                   {order.status}
//                 </span>
//               </TableCell>
//               <TableCell className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
//               <TableCell>
//                 <Select
//                   value={order.status}
//                   onValueChange={(value) => updateOrderStatus(order.id, value)}
//                   disabled={updating === order.id}
//                 >
//                   <SelectTrigger className="w-[130px] h-8 text-xs">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="pending">Pending</SelectItem>
//                     <SelectItem value="processing">Processing</SelectItem>
//                     <SelectItem value="shipped">Shipped</SelectItem>
//                     <SelectItem value="delivered">Delivered</SelectItem>
//                     <SelectItem value="cancelled">Cancelled</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   )
// }

// "use client"

// import { useState } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import type { Order, OrderItem, Product } from "@/lib/types"
// import { ShoppingCart, DollarSign, CreditCard, Eye, Mail, Phone, MapPin } from "lucide-react"

// // Extended types for cash orders
// type OrderWithItems = Order & {
//   order_items: (OrderItem & { product: Pick<Product, "name" | "images"> | null })[]
//   order_type?: 'stripe' | 'cash'
//   // Cash order specific fields
//   customer_name?: string
//   customer_email?: string
//   customer_phone?: string
//   delivery_address?: string
//   special_instructions?: string
//   items?: any[]
//   payment_method?: string
// }

// interface OrdersListProps {
//   orders: OrderWithItems[]
// }

// const statusColors: Record<string, string> = {
//   pending: "bg-yellow-500/10 text-yellow-500",
//   processing: "bg-blue-500/10 text-blue-500",
//   confirmed: "bg-blue-500/10 text-blue-500",
//   shipped: "bg-purple-500/10 text-purple-500",
//   delivered: "bg-green-500/10 text-green-500",
//   paid: "bg-green-500/10 text-green-500",
//   cancelled: "bg-red-500/10 text-red-500",
// }

// export function OrdersList({ orders: initialOrders }: OrdersListProps) {
//   const [orders, setOrders] = useState(initialOrders)
//   const [updating, setUpdating] = useState<string | null>(null)
//   const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

//   const updateOrderStatus = async (orderId: string, status: string) => {
//     setUpdating(orderId)
//     const supabase = createClient()

//     // Determine which table to update based on order type
//     const order = orders.find(o => o.id === orderId)
//     const tableName = order?.order_type === 'cash' ? 'cash_orders' : 'orders'

//     const { error } = await supabase
//       .from(tableName)
//       .update({ status })
//       .eq("id", orderId)

//     if (!error) {
//       setOrders(orders.map((order) => 
//         order.id === orderId ? { ...order, status: status as Order["status"] } : order
//       ))
//     }

//     setUpdating(null)
//   }

//   const getPaymentBadge = (order: OrderWithItems) => {
//     const orderType = order.order_type || 'stripe'
//     const color = orderType === 'cash' 
//       ? 'bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800' 
//       : 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800'
    
//     return (
//       <Badge variant="outline" className={`${color} gap-1`}>
//         {orderType === 'cash' ? (
//           <DollarSign className="h-3 w-3" />
//         ) : (
//           <CreditCard className="h-3 w-3" />
//         )}
//         {orderType === 'cash' ? 'Cash' : 'Card'}
//       </Badge>
//     )
//   }

//   const getOrderItems = (order: OrderWithItems) => {
//     if (order.order_type === 'stripe') {
//       return order.order_items || []
//     } else if (order.order_type === 'cash' && order.items) {
//       try {
//         return Array.isArray(order.items) ? order.items : JSON.parse(order.items)
//       } catch {
//         return []
//       }
//     }
//     return []
//   }

//   const getStatusOptions = (orderType?: string) => {
//     const baseOptions = [
//       { value: 'pending', label: 'Pending' },
//       { value: 'processing', label: 'Processing' },
//       { value: 'shipped', label: 'Shipped' },
//       { value: 'delivered', label: 'Delivered' },
//       { value: 'cancelled', label: 'Cancelled' },
//     ]

//     if (orderType === 'cash') {
//       // Add cash-specific statuses
//       return [
//         { value: 'pending', label: 'Pending' },
//         { value: 'confirmed', label: 'Confirmed' },
//         { value: 'processing', label: 'Processing' },
//         { value: 'delivered', label: 'Delivered' },
//         { value: 'paid', label: 'Paid' },
//         { value: 'cancelled', label: 'Cancelled' },
//       ]
//     }

//     return baseOptions
//   }

//   if (orders.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
//         <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
//         <p className="mt-4 text-muted-foreground">No orders yet</p>
//         <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers make purchases</p>
//       </div>
//     )
//   }

//   return (
//     <>
//       <div className="rounded-lg border border-border bg-card overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Order ID</TableHead>
//               <TableHead>Payment</TableHead>
//               <TableHead>Customer</TableHead>
//               <TableHead>Items</TableHead>
//               <TableHead>Total</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {orders.map((order) => {
//               const orderItems = getOrderItems(order)
              
//               return (
//                 <TableRow key={order.id}>
//                   <TableCell className="font-mono text-sm">
//                     #{order.id.slice(0, 8)}
//                   </TableCell>
//                   <TableCell>
//                     {getPaymentBadge(order)}
//                   </TableCell>
//                   <TableCell>
//                     <div className="text-sm">
//                       {order.customer_name || 'Customer'}
//                       {order.customer_email && (
//                         <p className="text-xs text-muted-foreground truncate max-w-[120px]">
//                           {order.customer_email}
//                         </p>
//                       )}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="space-y-1">
//                       {orderItems.slice(0, 2).map((item: any, index: number) => (
//                         <p key={index} className="text-sm">
//                           {item.quantity}x {item.product_name || item.name || 'Product'}
//                         </p>
//                       ))}
//                       {orderItems.length > 2 && (
//                         <p className="text-sm text-muted-foreground">+{orderItems.length - 2} more</p>
//                       )}
//                     </div>
//                   </TableCell>
//                   <TableCell className="font-medium">
//                     ${Number(order.total_amount).toFixed(2)}
//                   </TableCell>
//                   <TableCell>
//                     <span
//                       className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
//                     >
//                       {order.status}
//                     </span>
//                   </TableCell>
//                   <TableCell className="text-muted-foreground text-sm">
//                     {new Date(order.created_at).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Dialog>
//                         <DialogTrigger asChild>
//                           <Button 
//                             variant="ghost" 
//                             size="sm"
//                             onClick={() => setSelectedOrder(order)}
//                           >
//                             <Eye className="h-4 w-4" />
//                           </Button>
//                         </DialogTrigger>
//                         <DialogContent className="max-w-2xl">
//                           <DialogHeader>
//                             <DialogTitle>
//                               Order Details #{order.id.slice(0, 8)}
//                             </DialogTitle>
//                           </DialogHeader>
//                           <OrderDetailsDialog order={order} />
//                         </DialogContent>
//                       </Dialog>

//                       <Select
//                         value={order.status}
//                         onValueChange={(value) => updateOrderStatus(order.id, value)}
//                         disabled={updating === order.id}
//                       >
//                         <SelectTrigger className="w-[130px] h-8 text-xs">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {getStatusOptions(order.order_type).map((option) => (
//                             <SelectItem key={option.value} value={option.value}>
//                               {option.label}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               )
//             })}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Order Details Modal */}
//       {selectedOrder && (
//         <OrderDetailsDialog 
//           order={selectedOrder} 
//           onClose={() => setSelectedOrder(null)}
//         />
//       )}
//     </>
//   )
// }

// function OrderDetailsDialog({ 
//   order, 
//   onClose 
// }: { 
//   order: OrderWithItems, 
//   onClose?: () => void 
// }) {
//   const orderItems = order.order_type === 'stripe' 
//     ? order.order_items || []
//     : order.order_type === 'cash' && order.items
//       ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items))
//       : []

//   return (
//     <div className="space-y-4">
//       {/* Order Summary */}
//       <div className="grid grid-cols-2 gap-4 text-sm">
//         <div>
//           <p className="text-muted-foreground">Order ID</p>
//           <p className="font-medium font-mono">{order.id}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Date</p>
//           <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Total Amount</p>
//           <p className="font-medium text-lg">${Number(order.total_amount).toFixed(2)}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Payment Method</p>
//           <p className="font-medium capitalize">
//             {order.order_type === 'cash' ? `Cash (${order.payment_method || 'on delivery'})` : 'Credit/Debit Card'}
//           </p>
//         </div>
//       </div>

//       {/* Order Items */}
//       <div>
//         <h4 className="font-medium mb-2">Order Items</h4>
//         <div className="space-y-2">
//           {orderItems.map((item: any, index: number) => (
//             <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
//               <div className="flex items-center gap-3">
//                 {item.product?.images?.[0] ? (
//                   <img 
//                     src={item.product.images[0]} 
//                     alt={item.product_name || item.name}
//                     className="w-10 h-10 object-cover rounded"
//                   />
//                 ) : (
//                   <div className="w-10 h-10 bg-secondary rounded" />
//                 )}
//                 <div>
//                   <p className="font-medium">{item.product_name || item.name || 'Product'}</p>
//                   {order.order_type === 'cash' && item.vendor_name && (
//                     <p className="text-xs text-muted-foreground">Vendor: {item.vendor_name}</p>
//                   )}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className="font-medium">
//                   {item.quantity} x ${Number(item.unit_price || item.price || 0).toFixed(2)}
//                 </p>
//                 <p className="text-sm text-muted-foreground">
//                   ${(item.quantity * (item.unit_price || item.price || 0)).toFixed(2)}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Cash Order Specific Information */}
//       {order.order_type === 'cash' && (
//         <div className="border-t pt-4">
//           <h4 className="font-medium mb-3">Customer Information</h4>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {order.customer_name && (
//               <div>
//                 <p className="text-sm text-muted-foreground">Name</p>
//                 <p className="font-medium">{order.customer_name}</p>
//               </div>
//             )}
//             {order.customer_email && (
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   <Mail className="inline h-3 w-3 mr-1" />
//                   Email
//                 </p>
//                 <p className="font-medium truncate">
//                   {order.customer_email}
//                 </p>
//               </div>
//             )}
//             {order.customer_phone && (
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   <Phone className="inline h-3 w-3 mr-1" />
//                   Phone
//                 </p>
//                 <p className="font-medium">{order.customer_phone}</p>
//               </div>
//             )}
//             {order.delivery_address && (
//               <div className="md:col-span-2">
//                 <p className="text-sm text-muted-foreground">
//                   <MapPin className="inline h-3 w-3 mr-1" />
//                   Delivery Address
//                 </p>
//                 <p className="font-medium">{order.delivery_address}</p>
//               </div>
//             )}
//             {order.special_instructions && (
//               <div className="md:col-span-2">
//                 <p className="text-sm text-muted-foreground">Special Instructions</p>
//                 <p className="font-medium p-2 bg-secondary/50 rounded">{order.special_instructions}</p>
//               </div>
//             )}
//           </div>
          
//           {/* Quick Actions */}
//           <div className="flex gap-2 mt-4">
//             {order.customer_email && (
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => window.location.href = `mailto:${order.customer_email}`}
//               >
//                 <Mail className="h-4 w-4 mr-1" />
//                 Email Customer
//               </Button>
//             )}
//             {order.customer_phone && (
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => window.location.href = `tel:${order.customer_phone}`}
//               >
//                 <Phone className="h-4 w-4 mr-1" />
//                 Call Customer
//               </Button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Order Notes */}
//       <div>
//         <h4 className="font-medium mb-2">Order Status</h4>
//         <div className="flex items-center gap-2">
//           <span
//             className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
//           >
//             {order.status}
//           </span>
//           <p className="text-sm text-muted-foreground">
//             {order.status === 'pending' && 'Order has been placed and is awaiting processing'}
//             {order.status === 'confirmed' && 'Order has been confirmed by vendor'}
//             {order.status === 'processing' && 'Order is being prepared'}
//             {order.status === 'shipped' && 'Order has been shipped'}
//             {order.status === 'delivered' && 'Order has been delivered to customer'}
//             {order.status === 'paid' && 'Payment has been received'}
//             {order.status === 'cancelled' && 'Order has been cancelled'}
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }
// "use client"

// import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import type { Order, OrderItem, Product } from "@/lib/types"
// import { ShoppingCart, DollarSign, CreditCard, Eye, Mail, Phone, MapPin, MessageSquare } from "lucide-react"

// // Extended types to include cash order fields
// type OrderWithItems = Order & {
//   order_items: (OrderItem & { product: Pick<Product, "name" | "images"> | null })[]
//   order_type?: 'stripe' | 'cash'
//   // Cash order specific fields
//   customer_name?: string
//   customer_email?: string
//   customer_phone?: string
//   delivery_address?: string
//   special_instructions?: string
//   items?: any[]
//   payment_method?: string
// }

// interface OrdersListProps {
//   orders: OrderWithItems[]
// }

// // Extend status colors to include cash order statuses
// const statusColors: Record<string, string> = {
//   pending: "bg-yellow-500/10 text-yellow-500",
//   processing: "bg-blue-500/10 text-blue-500",
//   confirmed: "bg-blue-500/10 text-blue-500",
//   shipped: "bg-purple-500/10 text-purple-500",
//   delivered: "bg-green-500/10 text-green-500",
//   paid: "bg-green-500/10 text-green-500",
//   cancelled: "bg-red-500/10 text-red-500",
// }

// // Helper function to format date consistently
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString)
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   })
// }

// // Helper function to format datetime consistently
// const formatDateTime = (dateString: string) => {
//   const date = new Date(dateString)
//   return date.toLocaleString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   })
// }

// export function OrdersList({ orders: initialOrders }: OrdersListProps) {
//   const [orders, setOrders] = useState<OrderWithItems[]>([])
//   const [updating, setUpdating] = useState<string | null>(null)
//   const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

//   // Initialize orders after hydration to avoid hydration mismatch
//   useEffect(() => {
//     setOrders(initialOrders)
//   }, [initialOrders])

//   const updateOrderStatus = async (orderId: string, status: string) => {
//     setUpdating(orderId)
//     const supabase = createClient()

//     // Determine which table to update based on order type
//     const order = orders.find(o => o.id === orderId)
//     const tableName = order?.order_type === 'cash' ? 'cash_orders' : 'orders'

//     const { error } = await supabase
//       .from(tableName)
//       .update({ status })
//       .eq("id", orderId)

//     if (!error) {
//       setOrders(orders.map((order) => 
//         order.id === orderId ? { ...order, status: status as any } : order
//       ))
//     }

//     setUpdating(null)
//   }

//   const getPaymentBadge = (order: OrderWithItems) => {
//     const orderType = order.order_type || 'stripe'
//     const color = orderType === 'cash' 
//       ? 'bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800' 
//       : 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800'
    
//     return (
//       <Badge variant="outline" className={`${color} gap-1`}>
//         {orderType === 'cash' ? (
//           <DollarSign className="h-3 w-3" />
//         ) : (
//           <CreditCard className="h-3 w-3" />
//         )}
//         {orderType === 'cash' ? 'Cash' : 'Card'}
//       </Badge>
//     )
//   }

//   const getOrderItems = (order: OrderWithItems) => {
//     if (order.order_type === 'stripe') {
//       return order.order_items || []
//     } else if (order.order_type === 'cash' && order.items) {
//       try {
//         return Array.isArray(order.items) ? order.items : JSON.parse(order.items)
//       } catch {
//         return []
//       }
//     }
//     return []
//   }

//   const getStatusOptions = (orderType?: string) => {
//     const baseOptions = [
//       { value: 'pending', label: 'Pending' },
//       { value: 'processing', label: 'Processing' },
//       { value: 'shipped', label: 'Shipped' },
//       { value: 'delivered', label: 'Delivered' },
//       { value: 'cancelled', label: 'Cancelled' },
//     ]

//     if (orderType === 'cash') {
//       // Add cash-specific statuses
//       return [
//         { value: 'pending', label: 'Pending' },
//         { value: 'confirmed', label: 'Confirmed' },
//         { value: 'processing', label: 'Processing' },
//         { value: 'delivered', label: 'Delivered' },
//         { value: 'paid', label: 'Paid' },
//         { value: 'cancelled', label: 'Cancelled' },
//       ]
//     }

//     return baseOptions
//   }

//   // Show loading state while orders are being set
//   if (orders.length === 0 && initialOrders.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
//         <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
//         <p className="mt-4 text-muted-foreground">No orders yet</p>
//         <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers make purchases</p>
//       </div>
//     )
//   }

//   return (
//     <>
//       <div className="rounded-lg border border-border bg-card overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Order ID</TableHead>
//               <TableHead>Payment</TableHead>
//               <TableHead>Customer</TableHead>
//               <TableHead>Items</TableHead>
//               <TableHead>Total</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {orders.map((order) => {
//               const orderItems = getOrderItems(order)
              
//               return (
//                 <TableRow key={order.id}>
//                   <TableCell className="font-mono text-sm">
//                     #{order.id.slice(0, 8)}
//                   </TableCell>
//                   <TableCell>
//                     {getPaymentBadge(order)}
//                   </TableCell>
//                   <TableCell>
//                     <div className="text-sm">
//                       {order.customer_name || 'Customer'}
//                       {order.customer_email && (
//                         <p className="text-xs text-muted-foreground truncate max-w-[120px]">
//                           {order.customer_email}
//                         </p>
//                       )}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="space-y-1">
//                       {orderItems.slice(0, 2).map((item: any, index: number) => (
//                         <p key={index} className="text-sm">
//                           {item.quantity}x {item.product_name || item.name || 'Product'}
//                         </p>
//                       ))}
//                       {orderItems.length > 2 && (
//                         <p className="text-sm text-muted-foreground">+{orderItems.length - 2} more</p>
//                       )}
//                     </div>
//                   </TableCell>
//                   <TableCell className="font-medium">
//                     ${Number(order.total_amount).toFixed(2)}
//                   </TableCell>
//                   <TableCell>
//                     <span
//                       className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
//                     >
//                       {order.status}
//                     </span>
//                   </TableCell>
//                   <TableCell className="text-muted-foreground text-sm">
//                     {formatDate(order.created_at)}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Dialog>
//                         <DialogTrigger asChild>
//                           <Button 
//                             variant="ghost" 
//                             size="sm"
//                             onClick={() => setSelectedOrder(order)}
//                           >
//                             <Eye className="h-4 w-4" />
//                           </Button>
//                         </DialogTrigger>
//                         <DialogContent className="max-w-2xl">
//                           <DialogHeader>
//                             <DialogTitle>
//                               Order Details #{order.id.slice(0, 8)}
//                             </DialogTitle>
//                           </DialogHeader>
//                           <OrderDetailsDialog order={order} />
//                         </DialogContent>
//                       </Dialog>

//                       <Select
//                         value={order.status}
//                         onValueChange={(value) => updateOrderStatus(order.id, value)}
//                         disabled={updating === order.id}
//                       >
//                         <SelectTrigger className="w-[130px] h-8 text-xs">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {getStatusOptions(order.order_type).map((option) => (
//                             <SelectItem key={option.value} value={option.value}>
//                               {option.label}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               )
//             })}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Order Details Dialog */}
//       {selectedOrder && (
//         <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>
//                 Order Details #{selectedOrder.id.slice(0, 8)}
//               </DialogTitle>
//             </DialogHeader>
//             <OrderDetailsDialogContent order={selectedOrder} />
//           </DialogContent>
//         </Dialog>
//       )}
//     </>
//   )
// }

// function OrderDetailsDialog({ order }: { order: OrderWithItems }) {
//   const orderItems = getOrderItems(order)
  
//   return (
//     <div className="space-y-4">
//       {/* Order Summary */}
//       <div className="grid grid-cols-2 gap-4 text-sm">
//         <div>
//           <p className="text-muted-foreground">Order ID</p>
//           <p className="font-medium font-mono">{order.id}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Date</p>
//           <p className="font-medium">{formatDateTime(order.created_at)}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Total Amount</p>
//           <p className="font-medium text-lg">${Number(order.total_amount).toFixed(2)}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Payment Method</p>
//           <p className="font-medium capitalize">
//             {order.order_type === 'cash' ? `Cash (${order.payment_method || 'on delivery'})` : 'Credit/Debit Card'}
//           </p>
//         </div>
//       </div>

//       {/* Order Items */}
//       <div>
//         <h4 className="font-medium mb-2">Order Items</h4>
//         <div className="space-y-2">
//           {orderItems.map((item: any, index: number) => (
//             <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
//               <div className="flex items-center gap-3">
//                 {item.product?.images?.[0] ? (
//                   <img 
//                     src={item.product.images[0]} 
//                     alt={item.product_name || item.name}
//                     className="w-10 h-10 object-cover rounded"
//                   />
//                 ) : (
//                   <div className="w-10 h-10 bg-secondary rounded" />
//                 )}
//                 <div>
//                   <p className="font-medium">{item.product_name || item.name || 'Product'}</p>
//                   {item.vendor_name && (
//                     <p className="text-xs text-muted-foreground">Vendor: {item.vendor_name}</p>
//                   )}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className="font-medium">
//                   {item.quantity} x ${Number(item.unit_price || item.price || 0).toFixed(2)}
//                 </p>
//                 <p className="text-sm text-muted-foreground">
//                   ${(item.quantity * (item.unit_price || item.price || 0)).toFixed(2)}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Cash Order Specific Information */}
//       {order.order_type === 'cash' && (
//         <div className="border-t pt-4">
//           <h4 className="font-medium mb-3">Customer Information</h4>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {order.customer_name && (
//               <div>
//                 <p className="text-sm text-muted-foreground">Name</p>
//                 <p className="font-medium">{order.customer_name}</p>
//               </div>
//             )}
//             {order.customer_email && (
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   <Mail className="inline h-3 w-3 mr-1" />
//                   Email
//                 </p>
//                 <p className="font-medium truncate">
//                   {order.customer_email}
//                 </p>
//               </div>
//             )}
//             {order.customer_phone && (
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   <Phone className="inline h-3 w-3 mr-1" />
//                   Phone
//                 </p>
//                 <p className="font-medium">{order.customer_phone}</p>
//               </div>
//             )}
//             {order.delivery_address && (
//               <div className="md:col-span-2">
//                 <p className="text-sm text-muted-foreground">
//                   <MapPin className="inline h-3 w-3 mr-1" />
//                   Delivery Address
//                 </p>
//                 <p className="font-medium">{order.delivery_address}</p>
//               </div>
//             )}
//             {order.special_instructions && (
//               <div className="md:col-span-2">
//                 <p className="text-sm text-muted-foreground">
//                   <MessageSquare className="inline h-3 w-3 mr-1" />
//                   Special Instructions
//                 </p>
//                 <p className="font-medium p-2 bg-secondary/50 rounded">{order.special_instructions}</p>
//               </div>
//             )}
//           </div>
          
//           {/* Quick Actions */}
//           <div className="flex gap-2 mt-4">
//             {order.customer_email && (
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => window.location.href = `mailto:${order.customer_email}`}
//               >
//                 <Mail className="h-4 w-4 mr-1" />
//                 Email Customer
//               </Button>
//             )}
//             {order.customer_phone && (
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => window.location.href = `tel:${order.customer_phone}`}
//               >
//                 <Phone className="h-4 w-4 mr-1" />
//                 Call Customer
//               </Button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Order Notes */}
//       <div>
//         <h4 className="font-medium mb-2">Order Status</h4>
//         <div className="flex items-center gap-2">
//           <span
//             className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
//           >
//             {order.status}
//           </span>
//           <p className="text-sm text-muted-foreground">
//             {getStatusDescription(order.status)}
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

// function OrderDetailsDialogContent({ order }: { order: OrderWithItems }) {
//   return <OrderDetailsDialog order={order} />
// }

// function getStatusDescription(status: string) {
//   switch (status) {
//     case 'pending':
//       return 'Order has been placed and is awaiting processing'
//     case 'confirmed':
//       return 'Order has been confirmed by vendor'
//     case 'processing':
//       return 'Order is being prepared'
//     case 'shipped':
//       return 'Order has been shipped'
//     case 'delivered':
//       return 'Order has been delivered to customer'
//     case 'paid':
//       return 'Payment has been received'
//     case 'cancelled':
//       return 'Order has been cancelled'
//     default:
//       return 'Order status unknown'
//   }
// }
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Order, OrderItem, Product } from "@/lib/types"
import { ShoppingCart, DollarSign, CreditCard, Eye, Mail, Phone, MapPin, MessageSquare } from "lucide-react"

// Extended types to include cash order fields
type OrderWithItems = Order & {
  order_items: (OrderItem & { product: Pick<Product, "name" | "images"> | null })[]
  order_type?: 'stripe' | 'cash'
  // Cash order specific fields
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  special_instructions?: string
  items?: any[]
  payment_method?: string
}

interface OrdersListProps {
  orders: OrderWithItems[]
}

// Extend status colors to include cash order statuses
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-500",
  delivered: "bg-green-500/10 text-green-500",
  paid: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
}

// Helper function to format date consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Helper function to format datetime consistently
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper function to get order items
const getOrderItems = (order: OrderWithItems) => {
  if (order.order_type === 'stripe') {
    return order.order_items || []
  } else if (order.order_type === 'cash' && order.items) {
    try {
      return Array.isArray(order.items) ? order.items : JSON.parse(order.items)
    } catch {
      return []
    }
  }
  return []
}

// Helper function to get status description
const getStatusDescription = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Order has been placed and is awaiting processing'
    case 'confirmed':
      return 'Order has been confirmed by vendor'
    case 'processing':
      return 'Order is being prepared'
    case 'shipped':
      return 'Order has been shipped'
    case 'delivered':
      return 'Order has been delivered to customer'
    case 'paid':
      return 'Payment has been received'
    case 'cancelled':
      return 'Order has been cancelled'
    default:
      return 'Order status unknown'
  }
}

export function OrdersList({ orders: initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  // Initialize orders after hydration to avoid hydration mismatch
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    const supabase = createClient()

    // Determine which table to update based on order type
    const order = orders.find(o => o.id === orderId)
    const tableName = order?.order_type === 'cash' ? 'cash_orders' : 'orders'

    const { error } = await supabase
      .from(tableName)
      .update({ status })
      .eq("id", orderId)

    if (!error) {
      setOrders(orders.map((order) => 
        order.id === orderId ? { ...order, status: status as any } : order
      ))
    }

    setUpdating(null)
  }

  const getPaymentBadge = (order: OrderWithItems) => {
    const orderType = order.order_type || 'stripe'
    const color = orderType === 'cash' 
      ? 'bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800' 
      : 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800'
    
    return (
      <Badge variant="outline" className={`${color} gap-1`}>
        {orderType === 'cash' ? (
          <DollarSign className="h-3 w-3" />
        ) : (
          <CreditCard className="h-3 w-3" />
        )}
        {orderType === 'cash' ? 'Cash' : 'Card'}
      </Badge>
    )
  }

  const getStatusOptions = (orderType?: string) => {
    const baseOptions = [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
    ]

    if (orderType === 'cash') {
      // Add cash-specific statuses
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'paid', label: 'Paid' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    }

    return baseOptions
  }

  // Show loading state while orders are being set
  if (orders.length === 0 && initialOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No orders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers make purchases</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const orderItems = getOrderItems(order)
              
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    #{order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {getPaymentBadge(order)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.customer_name || 'Customer'}
                      {order.customer_email && (
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {order.customer_email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {orderItems.slice(0, 2).map((item: any, index: number) => (
                        <p key={index} className="text-sm">
                          {item.quantity}x {item.product_name || item.name || 'Product'}
                        </p>
                      ))}
                      {orderItems.length > 2 && (
                        <p className="text-sm text-muted-foreground">+{orderItems.length - 2} more</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Order Details #{order.id.slice(0, 8)}
                            </DialogTitle>
                          </DialogHeader>
                          <OrderDetailsDialog order={order} />
                        </DialogContent>
                      </Dialog>

                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions(order.order_type).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Order Details #{selectedOrder.id.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            <OrderDetailsDialogContent order={selectedOrder} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function OrderDetailsDialog({ order }: { order: OrderWithItems }) {
  const orderItems = getOrderItems(order)
  
  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Order ID</p>
          <p className="font-medium font-mono">{order.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">{formatDateTime(order.created_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Amount</p>
          <p className="font-medium text-lg">${Number(order.total_amount).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Payment Method</p>
          <p className="font-medium capitalize">
            {order.order_type === 'cash' ? `Cash (${order.payment_method || 'on delivery'})` : 'Credit/Debit Card'}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h4 className="font-medium mb-2">Order Items</h4>
        <div className="space-y-2">
          {orderItems.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
              <div className="flex items-center gap-3">
                {item.product?.images?.[0] ? (
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product_name || item.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-secondary rounded" />
                )}
                <div>
                  <p className="font-medium">{item.product_name || item.name || 'Product'}</p>
                  {item.vendor_name && (
                    <p className="text-xs text-muted-foreground">Vendor: {item.vendor_name}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {item.quantity} x ${Number(item.unit_price || item.price || 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${(item.quantity * (item.unit_price || item.price || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Order Specific Information */}
      {order.order_type === 'cash' && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.customer_name && (
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
            )}
            {order.customer_email && (
              <div>
                <p className="text-sm text-muted-foreground">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Email
                </p>
                <p className="font-medium truncate">
                  {order.customer_email}
                </p>
              </div>
            )}
            {order.customer_phone && (
              <div>
                <p className="text-sm text-muted-foreground">
                  <Phone className="inline h-3 w-3 mr-1" />
                  Phone
                </p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
            )}
            {order.delivery_address && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Delivery Address
                </p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            )}
            {order.special_instructions && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  <MessageSquare className="inline h-3 w-3 mr-1" />
                  Special Instructions
                </p>
                <p className="font-medium p-2 bg-secondary/50 rounded">{order.special_instructions}</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            {order.customer_email && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = `mailto:${order.customer_email}`}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email Customer
              </Button>
            )}
            {order.customer_phone && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = `tel:${order.customer_phone}`}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call Customer
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Order Notes */}
      <div>
        <h4 className="font-medium mb-2">Order Status</h4>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500'}`}
          >
            {order.status}
          </span>
          <p className="text-sm text-muted-foreground">
            {getStatusDescription(order.status)}
          </p>
        </div>
      </div>
    </div>
  )
}

function OrderDetailsDialogContent({ order }: { order: OrderWithItems }) {
  return <OrderDetailsDialog order={order} />
}