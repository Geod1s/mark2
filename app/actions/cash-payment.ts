"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CashOrderItem {
  product_id: string
  quantity: number
  price: number
  product_name: string
  vendor_id: string
  vendor_name: string
}

interface CreateCashOrderInput {
  items: CashOrderItem[]
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  special_instructions?: string
  payment_method?: 'cash' | 'bank_transfer'
}

export async function createCashOrder(orderData: CreateCashOrderInput) {
  // Add 'await' here
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error("You must be logged in to place an order")
  }

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Cart is empty")
  }

  // Calculate total
  const totalAmount = orderData.items.reduce((total: number, item: CashOrderItem) => {
    return total + (item.price * item.quantity)
  }, 0)

  try {
    // Get user email for fallback
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData.user?.email || 'customer@example.com'
    const userName = orderData.customer_name || 'Customer'

    // Create cash order for each vendor
    const vendorGroups = orderData.items.reduce((groups: Record<string, CashOrderItem[]>, item: CashOrderItem) => {
      if (!groups[item.vendor_id]) {
        groups[item.vendor_id] = []
      }
      groups[item.vendor_id].push(item)
      return groups
    }, {})

    const orderIds = []

    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      const vendorTotal = vendorItems.reduce((total: number, item: CashOrderItem) => {
        return total + (item.price * item.quantity)
      }, 0)

      const { data: order, error } = await supabase
        .from('cash_orders')
        .insert({
          user_id: user.id,
          vendor_id: vendorId,
          total_amount: vendorTotal,
          items: vendorItems,
          customer_name: orderData.customer_name || userName,
          customer_email: orderData.customer_email || userEmail,
          customer_phone: orderData.customer_phone || '',
          delivery_address: orderData.delivery_address || 'Address not specified',
          special_instructions: orderData.special_instructions || '',
          payment_method: orderData.payment_method || 'cash',
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating cash order:", error)
        throw new Error(`Failed to create order: ${error.message}`)
      }

      orderIds.push(order.id)
      
      // Clear cart items for this vendor
      const productIds = vendorItems.map((item: CashOrderItem) => item.product_id)
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .in('product_id', productIds)

      // Update product stock for each item
      for (const item of vendorItems) {
        // Get current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          const currentStock = product.stock_quantity || 0
          const newStock = Math.max(0, currentStock - item.quantity)
          
          // Update stock
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id)

          if (updateError) {
            console.error(`Error updating stock for product ${item.product_id}:`, updateError)
          }
        }
      }
    }

    revalidatePath('/orders')
    revalidatePath('/cart')
    revalidatePath('/dashboard/products') // Revalidate products page
    
    return { 
      success: true, 
      orderIds,
      message: "Cash order placed successfully! The vendor will contact you for more details."
    }

  } catch (error) {
    console.error("Cash order error:", error)
    throw error instanceof Error ? error : new Error("Failed to place cash order")
  }
}