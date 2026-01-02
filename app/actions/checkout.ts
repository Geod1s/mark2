// app/actions/checkout.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"

interface CheckoutItem {
  product_id: string
  quantity: number
  vendor_id: string
}

export async function createSimpleCheckoutSession(items: CheckoutItem[]) {
  // ADD THIS 'await' - IT'S THE FIX!
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  if (items.length === 0) {
    throw new Error("Cart is empty")
  }

  // Get product details
  const productIds = items.map((item) => item.product_id)
  const { data: products } = await supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name)")
    .in("id", productIds)

  if (!products || products.length === 0) {
    throw new Error("Products not found")
  }

  // Build line items for Stripe
  const lineItems = items.map((item) => {
    const product = products.find((p: any) => p.id === item.product_id)
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`)
    }

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description || undefined,
          images: product.images?.length > 0 ? [product.images[0]] : undefined,
          metadata: {
            vendor_id: product.vendor?.id || 'unknown',
            vendor_name: product.vendor?.store_name || 'Unknown Vendor',
          },
        },
        unit_amount: Math.round(product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }
  })

  // Calculate totals for metadata
  const subtotal = items.reduce((total: number, item) => {
    const product = products.find((p: any) => p.id === item.product_id)
    return total + (product ? product.price * item.quantity : 0)
  }, 0)

  // Create checkout session (regular payment, no Connect transfers)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "embedded",
    line_items: lineItems,
    metadata: {
      user_id: user.id,
      items: JSON.stringify(
        items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          vendor_id: item.vendor_id,
        })),
      ),
      subtotal: subtotal.toString(),
      demo_mode: "true",
      customer_email: user.email || "",
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: user.email || undefined,
  })

  console.log("✅ Demo checkout session created:", session.id)
  
  return session.client_secret
}