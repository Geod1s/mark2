import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const orderData = await request.json()
    
    // Verify the vendor belongs to the current user
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', orderData.vendor_id)
      .eq('user_id', user.id)
      .single()
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Unauthorized: Vendor not found or doesn\'t belong to user' },
        { status: 403 }
      )
    }
    
    // Create the cash order with user_id to satisfy RLS
    const { data: order, error } = await supabase
      .from('cash_orders')
      .insert({
        ...orderData,
        user_id: user.id // This is crucial for RLS
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating POS order:', error)
      return NextResponse.json(
        { error: `Failed to create order: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      order
    })
    
  } catch (error) {
    console.error('POS order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}