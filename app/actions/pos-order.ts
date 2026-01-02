"use server"

import { createClient } from "@/lib/supabase/server"

interface CreatePOSOrderInput {
  vendor_id: string
  total_amount: number
  items: any[]
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address: string
  payment_method: 'cash' | 'card'
  status: string
  is_pos_order: boolean
}

export async function createPOSOrder(orderData: CreatePOSOrderInput) {
  // Add 'await' here
  const supabase = await createClient()
  
  // Get the current user to verify they own the vendor
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  // Verify the vendor belongs to the current user
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', orderData.vendor_id)
    .eq('user_id', user.id)
    .single()
  
  if (!vendor) {
    throw new Error("Unauthorized: Vendor not found or doesn't belong to user")
  }
  
  // Create the cash order
  const { data: order, error } = await supabase
    .from('cash_orders')
    .insert({
      ...orderData,
      user_id: user.id // Add user_id to satisfy RLS
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error creating POS order:", error)
    throw new Error(`Failed to create order: ${error.message}`)
  }
  
  return { success: true, order }
}