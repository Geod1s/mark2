// app/api/products/[productId]/restore-stock/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Use 'await' since createClient returns a Promise
    const supabase = await createClient()
    const productId = params.productId
    const { quantity } = await request.json()

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      )
    }

    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (fetchError) {
      console.error("Error fetching product:", fetchError)
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Calculate new stock
    const newStock = (product.stock_quantity || 0) + quantity

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
      throw updateError
    }

    // Log stock restoration (if stock_logs table exists)
    try {
      await supabase.from("stock_logs").insert({
        product_id: productId,
        quantity_change: quantity,
        new_stock: newStock,
        reason: "order_cancellation",
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.warn("Could not log stock change:", logError)
      // Continue even if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Stock restored successfully",
      newStock 
    })
  } catch (error) {
    console.error("Error restoring stock:", error)
    return NextResponse.json(
      { error: "Failed to restore stock" },
      { status: 500 }
    )
  }
}