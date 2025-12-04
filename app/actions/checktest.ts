// Simple checkout without vendor payouts for demo
"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"

export async function createSimpleCheckoutSession(items: any[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  // Get product details
  const productIds = items.map((item) => item.product_id)
  const { data: products } = await supabase.from("products").select("*").in("id", productIds)

  const lineItems = items.map((item) => {
    const product = products?.find((p) => p.id === item.product_id)
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product?.name || "Product",
          description: product?.description || undefined,
        },
        unit_amount: product ? Math.round(product.price * 100) : 1000, // $10 default
      },
      quantity: item.quantity,
    }
  })

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: {
      user_id: user.id,
      demo_mode: "true",
    },
  })

  return session.url // Redirect to this URL
}