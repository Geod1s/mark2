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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Initialize orders after hydration to avoid hydration mismatch
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // Function to update product stock quantity - FIXED VERSION
  const updateProductStock = async (productId: string, quantityChange: number) => {
    const supabase = createClient()
    
    try {
      console.log(`Starting stock update for product ${productId}, change: ${quantityChange}`)
      
      // Get current product stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity, name")
        .eq("id", productId)
        .single()

      if (fetchError) {
        console.error("Error fetching product:", fetchError)
        
        // Try alternative approach if the product doesn't exist
        if (fetchError.code === 'PGRST116') {
          throw new Error(`Product with ID ${productId} not found`)
        }
        throw new Error(`Failed to fetch product: ${fetchError.message}`)
      }

      console.log(`Current stock for ${product.name}: ${product.stock_quantity || 0}`)
      
      // Calculate new stock - FIXED: Ensure proper number conversion
      const currentStock = Number(product.stock_quantity) || 0
      
      // Ensure quantityChange is a proper number
      const change = Number(quantityChange) || 0
      
      // Calculate new stock - This should now work correctly
      const newStock = currentStock + change

      console.log(`Calculating stock: ${currentStock} + ${change} = ${newStock}`)

      // Ensure stock doesn't go negative (but allow it for now and log warning)
      if (newStock < 0) {
        console.warn(`Warning: Stock would go negative for ${product.name}. Current: ${currentStock}, Change: ${change}, New: ${newStock}`)
        // We'll still proceed but log the issue
      }

      console.log(`Updating ${product.name} from ${currentStock} to ${newStock}`)

      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId)

      if (updateError) {
        console.error("Error updating stock:", updateError)
        
        // Try alternative approach if the first update fails
        console.log("Trying alternative update approach...")
        
        // Use upsert instead of update
        const { error: upsertError } = await supabase
          .from("products")
          .upsert({
            id: productId,
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (upsertError) {
          console.error("Upsert also failed:", upsertError)
          throw new Error(`Failed to update stock: ${upsertError.message}`)
        }
      }

      console.log(`Successfully updated product ${product.name} (${productId}): ${currentStock} -> ${newStock}`)

      return newStock
    } catch (err: any) {
      console.error("Error in updateProductStock:", err)
      throw err
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      // Find the order
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        throw new Error("Order not found")
      }

      const orderType = order.order_type || 'stripe'

      // Get authoritative order items from the database to avoid mismatches
      let orderItems: any[] = []
      let dbOrder: any = null
      const tableName = orderType === 'cash' ? 'cash_orders' : 'orders'
      try {
        // Fetch fresh order record
        const { data, error: dbOrderError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', orderId)
          .single()

        dbOrder = data

        if (dbOrderError) {
          console.warn('Could not fetch order from DB, falling back to client state items:', dbOrderError)
          orderItems = getOrderItems(order)
        } else {
          if (order.order_type === 'stripe') {
            // For stripe orders, fetch order_items rows
            const { data: dbOrderItems, error: dbOrderItemsError } = await supabase
              .from('order_items')
              .select('product_id, quantity')
              .eq('order_id', orderId)

            if (dbOrderItemsError || !dbOrderItems) {
              console.warn('Could not fetch order_items, falling back to client state items:', dbOrderItemsError)
              orderItems = getOrderItems(order)
            } else {
              orderItems = dbOrderItems as any[]
            }
          } else {
            // For cash orders, prefer the stored items payload
            if (dbOrder.items) {
              try {
                orderItems = Array.isArray(dbOrder.items) ? dbOrder.items : JSON.parse(dbOrder.items)
              } catch {
                orderItems = getOrderItems(order)
              }
            } else {
              orderItems = getOrderItems(order)
            }
          }
        }
      } catch (fetchErr) {
        console.warn('Error fetching authoritative order items, using client state:', fetchErr)
        orderItems = getOrderItems(order)
      }
      console.log(`Order Items Count: ${orderItems.length}`)

      // Determine authoritative old status (prefer DB value)
      const oldStatus = (dbOrder && dbOrder.status) ? dbOrder.status : (order.status as string)
      console.log(`=== Starting order update ===`)
      console.log(`Order ID: ${orderId}`)
      console.log(`Order Type: ${orderType}`)
      console.log(`Status Change: ${oldStatus} -> ${newStatus}`)

      // Track all stock updates
      const stockUpdates: Array<{productId: string, quantityChange: number, reason: string}> = []
      // Flags to indicate whether we applied a refund or uncancel (used later for DB/UI sync)
      let appliedRefund = false
      let appliedUncancel = false

      // Handle stock adjustments based on status changes
      if (oldStatus !== newStatus) {
        console.log(`Stock adjustment needed: ${oldStatus} -> ${newStatus}`)

        // Atomically update the order status first so only the caller that
        // actually changes the status will perform stock adjustments.
        console.log(`Attempting conditional status update in table ${tableName}`)

        const { data: statusUpdateData, error: statusUpdateError } = await supabase
          .from(tableName)
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .neq('status', newStatus)
          .select('id')

        if (statusUpdateError) {
          console.error('Error performing conditional status update:', statusUpdateError)
          throw new Error(`Failed to update order status: ${statusUpdateError.message}`)
        }

        // If no rows were returned, the status was already updated elsewhere — skip stock changes
        if (!statusUpdateData || (Array.isArray(statusUpdateData) && statusUpdateData.length === 0)) {
          console.log('Order status was already set to the desired value by another process; skipping stock adjustments')
          setSuccess(`Order status is already ${newStatus}`)
          setTimeout(() => setSuccess(null), 3000)
          setUpdating(null)
          return
        }
        
        // For STRIPE orders (already paid when created)
        if (orderType === 'stripe') {
          // Handle status transitions for stripe orders
          // If changing FROM paid TO cancelled: Refund stock (only one refund regardless of path)
          if (oldStatus === 'paid' && newStatus === 'cancelled') {
            console.log("Stripe order paid -> cancelled - refunding stock")

            try {
              const { error: rpcError } = await supabase.rpc('refund_order_stock', { p_order_id: orderId })
              if (rpcError) {
                console.log('RPC refund_order_stock not available, using fallback for stripe order:', rpcError)

                // Fallback: manually refund stock if RPC fails
                console.log("Falling back to manual stock refund for stripe order")
                for (const item of orderItems) {
                  const productId = item.product_id
                  const quantity = Number(item.quantity) || 0

                  console.log(`Processing stripe item for refund: product_id=${productId}, quantity=${quantity}`)

                  if (!productId) {
                    console.warn("Item missing product ID, skipping:", item)
                    continue
                  }

                  stockUpdates.push({
                    productId,
                    quantityChange: quantity, // Positive to increase stock
                    reason: 'stripe_cancelled_refund'
                  })
                }
              } else {
                console.log('RPC refund_order_stock completed')
                appliedRefund = true
              }
            } catch (rpcErr) {
              console.log('RPC call error, using fallback for stripe order:', rpcErr)

              // Fallback: manually refund stock if RPC fails
              console.log("Falling back to manual stock refund for stripe order")
              for (const item of orderItems) {
                const productId = item.product_id
                const quantity = Number(item.quantity) || 0

                console.log(`Processing stripe item for refund: product_id=${productId}, quantity=${quantity}`)

                if (!productId) {
                  console.warn("Item missing product ID, skipping:", item)
                  continue
                }

                stockUpdates.push({
                  productId,
                  quantityChange: quantity, // Positive to increase stock
                  reason: 'stripe_cancelled_refund'
                })
              }
            }
          }
          // If changing TO cancelled (but not from paid): Use server RPC to perform an atomic, idempotent refund
          else if (newStatus === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'paid') {
            console.log("Stripe order cancelled (not from paid) - invoking server refund RPC")

            try {
              const { error: rpcError } = await supabase.rpc('refund_order_stock', { p_order_id: orderId })
              if (rpcError) {
                console.log('RPC refund_order_stock not available, using fallback for stripe order:', rpcError)

                // Fallback: manually refund stock if RPC fails
                console.log("Falling back to manual stock refund for stripe order")
                for (const item of orderItems) {
                  const productId = item.product_id
                  const quantity = Number(item.quantity) || 0

                  console.log(`Processing stripe item for refund: product_id=${productId}, quantity=${quantity}`)

                  if (!productId) {
                    console.warn("Item missing product ID, skipping:", item)
                    continue
                  }

                  stockUpdates.push({
                    productId,
                    quantityChange: quantity, // Positive to increase stock
                    reason: 'stripe_cancelled_refund'
                  })
                }
              } else {
                console.log('RPC refund_order_stock completed')
                appliedRefund = true
              }
            } catch (rpcErr) {
              console.log('RPC call error, using fallback for stripe order:', rpcErr)

              // Fallback: manually refund stock if RPC fails
              console.log("Falling back to manual stock refund for stripe order")
              for (const item of orderItems) {
                const productId = item.product_id
                const quantity = Number(item.quantity) || 0

                console.log(`Processing stripe item for refund: product_id=${productId}, quantity=${quantity}`)

                if (!productId) {
                  console.warn("Item missing product ID, skipping:", item)
                  continue
                }

                stockUpdates.push({
                  productId,
                  quantityChange: quantity, // Positive to increase stock
                  reason: 'stripe_cancelled_refund'
                })
              }
            }
          }
          // If changing FROM cancelled to another status: Decrease stock for all items
          // (This handles the case where someone accidentally cancels and wants to undo)
          else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
            console.log("Stripe order uncancelled - attempting to re-apply charge (idempotent)")

            const wasRefunded = !!(dbOrder && dbOrder.stock_refunded)
            if (!wasRefunded) {
              console.log('Stripe order was not marked refunded in DB; skipping re-apply')
            } else {
              for (const item of orderItems) {
                const productId = item.product_id
                const quantity = Number(item.quantity) || 0

                console.log(`Processing stripe item: product_id=${productId}, quantity=${quantity}`)

                if (!productId) {
                  console.warn("Item missing product ID, skipping:", item)
                  continue
                }

                stockUpdates.push({
                  productId,
                  quantityChange: -quantity, // Negative to decrease stock
                  reason: 'stripe_uncancelled'
                })
              }
            }
          }
        }

        // For CASH orders (pay later)
        if (orderType === 'cash') {
          console.log("Processing cash order stock adjustments")

          // If changing FROM paid TO cancelled: Increase stock (refund when cancelling paid order)
          if (oldStatus === 'paid' && newStatus === 'cancelled') {
            console.log("Cash order paid -> cancelled - refunding stock")

            try {
              const { error: rpcError } = await supabase.rpc('refund_order_stock', { p_order_id: orderId })
              if (rpcError) {
                console.log('RPC refund_order_stock not available, using fallback for cash order:', rpcError)

                // Fallback: manually refund stock if RPC fails
                console.log("Falling back to manual stock refund for cash order")
                for (const item of orderItems) {
                  const productId = item.product_id || item.id
                  const quantity = Number(item.quantity) || 0

                  console.log(`Processing cash item for refund: product_id=${productId}, quantity=${quantity}`)

                  if (!productId) {
                    console.warn("Item missing product ID, skipping:", item)
                    continue
                  }

                  stockUpdates.push({
                    productId,
                    quantityChange: quantity, // Positive to increase stock
                    reason: 'cash_cancelled_refund'
                  })
                }
              } else {
                console.log('RPC refund_order_stock completed for cash order')
                appliedRefund = true
              }
            } catch (rpcErr) {
              console.log('RPC call error, using fallback for cash order:', rpcErr)

              // Fallback: manually refund stock if RPC fails
              console.log("Falling back to manual stock refund for cash order")
              for (const item of orderItems) {
                const productId = item.product_id || item.id
                const quantity = Number(item.quantity) || 0

                console.log(`Processing cash item for refund: product_id=${productId}, quantity=${quantity}`)

                if (!productId) {
                  console.warn("Item missing product ID, skipping:", item)
                  continue
                }

                stockUpdates.push({
                  productId,
                  quantityChange: quantity, // Positive to increase stock
                  reason: 'cash_cancelled_refund'
                })
              }
            }
          }
          // If changing TO cancelled (but not from paid): No stock adjustment needed for unpaid orders
          else if (newStatus === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'paid') {
            console.log("Unpaid cash order cancelled - no stock adjustment needed")
          }
          // If changing TO paid: Decrease stock (customer paid)
          else if (newStatus === 'paid' && oldStatus !== 'paid') {
            console.log("Cash order marked as paid - decreasing stock")

            for (const item of orderItems) {
              // For cash orders, check both product_id and id
              const productId = item.product_id || item.id
              const quantity = Number(item.quantity) || 0

              console.log(`Processing cash item: product_id=${productId}, quantity=${quantity}`)

              if (!productId) {
                console.warn("Item missing product ID, skipping:", item)
                continue
              }

              stockUpdates.push({
                productId,
                quantityChange: -quantity, // Negative to decrease stock
                reason: 'cash_paid'
              })
            }
          }
          // If changing FROM paid to another status (but not cancelled): Increase stock (undo payment)
          else if (oldStatus === 'paid' && newStatus !== 'paid' && newStatus !== 'cancelled') {
            console.log("Cash order unmarked as paid - increasing stock (undo payment)")

            for (const item of orderItems) {
              const productId = item.product_id || item.id
              const quantity = Number(item.quantity) || 0

              console.log(`Processing cash item: product_id=${productId}, quantity=${quantity}`)

              if (!productId) {
                console.warn("Item missing product ID, skipping:", item)
                continue
              }

              stockUpdates.push({
                productId,
                quantityChange: quantity, // Positive to increase stock
                reason: 'cash_unpaid'
              })
            }
          }
        }
      } else {
        console.log("No stock adjustment needed - same status")
      }

      // Log all stock updates before executing
      console.log(`Total stock updates to process: ${stockUpdates.length}`)
      console.log("Stock updates:", JSON.stringify(stockUpdates, null, 2))

      // Execute stock updates
      if (stockUpdates.length > 0) {
        console.log("Executing stock updates...")
        
        // Group updates by product to avoid duplicate updates
        const groupedUpdates = new Map()
        
        for (const update of stockUpdates) {
          const existing = groupedUpdates.get(update.productId) || 0
          groupedUpdates.set(update.productId, existing + update.quantityChange)
        }
        
        console.log("Grouped updates:", Object.fromEntries(groupedUpdates))
        
        // Process each product update
        const updateResults = []
        for (const [productId, totalQuantityChange] of groupedUpdates) {
          console.log(`Processing update for product ${productId}: total change = ${totalQuantityChange}`)
          
          try {
            const result = await updateProductStock(productId, totalQuantityChange)
            updateResults.push({ productId, success: true, result })
            console.log(`Successfully updated product ${productId}`)
          } catch (err) {
            console.error(`Failed to update product ${productId}:`, err)
            updateResults.push({ productId, success: false, error: err })
          }
        }
        
        // Check if any updates failed
        const failedUpdates = updateResults.filter(r => !r.success)
        if (failedUpdates.length > 0) {
          console.error("Some stock updates failed:", failedUpdates)
          throw new Error(`Failed to update stock for ${failedUpdates.length} products`)
        }
        
        console.log("All stock updates completed successfully")

        // Determine whether we applied a refund or a re-apply so we can mark the order
        // accordingly (idempotency). If any refund reasons were used, mark refunded=true.
        const appliedReasons = stockUpdates.map(s => s.reason)
        appliedRefund = appliedReasons.some(r => /refund/i.test(r))
        appliedUncancel = appliedReasons.some(r => /uncancel|re-apply/i.test(r))

        try {
          // Update the order row to reflect refund state
          if (appliedRefund || appliedUncancel) {
            const flagValue = appliedRefund ? true : false
            await supabase
              .from(tableName)
              .update({ stock_refunded: flagValue, updated_at: new Date().toISOString() })
              .eq('id', orderId)
          }
        } catch (flagErr) {
          console.warn('Failed to update order stock_refunded flag:', flagErr)
        }
      }


      // Note: the order status was already updated conditionally earlier so we
      // don't update it again here. We proceed to update local state below.

      // Update local state (include stock_refunded if we changed it)
      const newRefundedState = (typeof appliedRefund !== 'undefined' && (appliedRefund || appliedUncancel)) ? (appliedRefund ? true : false) : undefined

      setOrders(orders.map((order) => {
        if (order.id !== orderId) return order
        const updated: any = { ...order, status: newStatus as any }
        if (typeof newRefundedState !== 'undefined') {
          updated.stock_refunded = newRefundedState
        }
        return updated
      }))

      setSuccess(`Order status updated to ${newStatus} and stock adjusted successfully.`)
      setTimeout(() => setSuccess(null), 3000)

      console.log(`=== Order update completed successfully ===`)

    } catch (err: any) {
      console.error("=== Error updating order ===", err)
      setError(err.message || "Failed to update order status")
      setTimeout(() => setError(null), 5000)
    } finally {
      setUpdating(null)
    }
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
      {/* Status Messages */}
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          <p>{success}</p>
        </div>
      )}

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
        onClick={(e) => {
          e.preventDefault(); // Add this line
          e.stopPropagation(); // Prevents the event from bubbling up
          setSelectedOrder(order);
        }}
        className=" hover:bg-transparent hover:text-black cursor-pointer"
      >
        <Eye className="h-4 w-4 " />
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
    <SelectTrigger className="w-[130px] h-8 text-xs cursor-pointer">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className=" bg-black text-white">
      {getStatusOptions(order.order_type).map((option) => (
        <SelectItem 
          key={option.value} 
          value={option.value}
          // focus: targets keyboard navigation
          // data-[highlighted]: targets mouse hover and active state
          className="focus:bg-transparent focus:text-white cursor-pointer text-white transition-colors cursor-pointer"
        >
          {updating === order.id ? "Updating..." : option.label}
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
          {/* <div className="flex gap-2 mt-4">
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
          </div> */}
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