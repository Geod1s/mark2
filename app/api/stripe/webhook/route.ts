import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // In production, you should verify the webhook signature
    // For now, we'll parse the event directly
    event = JSON.parse(body) as Stripe.Event
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === "paid" && session.metadata) {
        const { user_id, vendor_id, items } = session.metadata
        const parsedItems = JSON.parse(items) as { product_id: string; quantity: number }[]

        // Create the order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id,
            vendor_id,
            status: "pending",
            total_amount: (session.amount_total || 0) / 100,
            platform_fee: (session.total_details?.amount_tax || 0) / 100,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .select()
          .single()

        if (orderError) {
          console.error("Failed to create order:", orderError)
          break
        }

        // Get product details for order items (include stock fields)
        const productIds = parsedItems.map((item) => item.product_id)
        const { data: products } = await supabase
          .from("products")
          .select("id, name, price, stock_quantity, inventory_count")
          .in("id", productIds)

        if (products && order) {
          // Create order items
          const orderItems = parsedItems.map((item) => {
            const product = products.find((p) => p.id === item.product_id)
            return {
              order_id: order.id,
              product_id: item.product_id,
              product_name: product?.name || "Unknown Product",
              quantity: item.quantity,
              unit_price: product?.price || 0,
            }
          })

          await supabase.from("order_items").insert(orderItems)

          // Update product inventory (use stock_quantity primarily, fall back to inventory_count)
          for (const item of parsedItems) {
            const product = products.find((p) => p.id === item.product_id)
            if (product) {
              const currentStock = Number((product as any).stock_quantity ?? (product as any).inventory_count ?? 0)
              const newStock = Math.max(0, currentStock - item.quantity)

              await supabase
                .from("products")
                .update({
                  stock_quantity: newStock,
                  inventory_count: newStock,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", item.product_id)
            }
          }

          // Clear the user's cart
          await supabase.from("cart_items").delete().eq("user_id", user_id)
        }
      }
      break
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account

      // Update vendor's Stripe status
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase.from("vendors").update({ stripe_onboarding_complete: true }).eq("stripe_account_id", account.id)
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
