// app/api/orders/[orderId]/cancel/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Use 'await' since createClient returns a Promise
    const supabase = await createClient()
    const orderId = params.orderId

    // Update order status to cancelled
    const { error: orderError } = await supabase
      .from("orders")
      .update({ 
        status: "cancelled",
        cancelled_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (orderError) {
      console.error("Supabase error:", orderError)
      throw orderError
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order cancelled successfully" 
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    )
  }
}