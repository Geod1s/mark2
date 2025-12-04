// "use server"

// import { createClient } from "@/lib/supabase/server"
// import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe"
// import { redirect } from "next/navigation"

// interface CheckoutItem {
//   product_id: string
//   quantity: number
//   vendor_id: string
// }

// export async function createCheckoutSession(items: CheckoutItem[]) {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/checkout")
//   }

//   if (items.length === 0) {
//     throw new Error("Cart is empty")
//   }

//   // Get product details
//   const productIds = items.map((item) => item.product_id)
//   const { data: products } = await supabase.from("products").select("*, vendor:vendors(*)").in("id", productIds)

//   if (!products || products.length === 0) {
//     throw new Error("Products not found")
//   }

//   // Group items by vendor
//   const itemsByVendor = items.reduce(
//     (acc, item) => {
//       if (!acc[item.vendor_id]) {
//         acc[item.vendor_id] = []
//       }
//       acc[item.vendor_id].push(item)
//       return acc
//     },
//     {} as Record<string, CheckoutItem[]>,
//   )

//   // For simplicity, we'll process orders for each vendor separately
//   // In a real app, you might want to create a single checkout with transfers
//   const vendorIds = Object.keys(itemsByVendor)

//   if (vendorIds.length > 1) {
//     // Multiple vendors - redirect to multi-vendor checkout
//     // For now, we'll just use the first vendor
//     console.log("Multiple vendors detected, processing first vendor only")
//   }

//   const vendorId = vendorIds[0]
//   const vendorItems = itemsByVendor[vendorId]

//   // Get vendor's Stripe account
//   const { data: vendor } = await supabase.from("vendors").select("*").eq("id", vendorId).single()

//   if (!vendor) {
//     throw new Error("Vendor not found")
//   }

//   // Build line items for Stripe
//   const lineItems = vendorItems.map((item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     if (!product) {
//       throw new Error(`Product ${item.product_id} not found`)
//     }

//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: product.name,
//           description: product.description || undefined,
//           images: product.images?.length > 0 ? [product.images[0]] : undefined,
//         },
//         unit_amount: Math.round(product.price * 100), // Convert to cents
//       },
//       quantity: item.quantity,
//     }
//   })

//   // Calculate totals
//   const subtotal = vendorItems.reduce((total, item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     return total + (product ? product.price * item.quantity : 0)
//   }, 0)

//   const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT) // Fee in cents

//   // Create checkout session options
//   const sessionOptions: Parameters<typeof stripe.checkout.sessions.create>[0] = {
//     mode: "payment",
//     ui_mode: "embedded",
//     redirect_on_completion: "never",
//     line_items: lineItems,
//     metadata: {
//       user_id: user.id,
//       vendor_id: vendorId,
//       items: JSON.stringify(
//         vendorItems.map((item) => ({
//           product_id: item.product_id,
//           quantity: item.quantity,
//         })),
//       ),
//     },
//   }

//   // If vendor has connected Stripe account, use Connect
//   if (vendor.stripe_account_id && vendor.stripe_onboarding_complete) {
//     sessionOptions.payment_intent_data = {
//       application_fee_amount: platformFee,
//       transfer_data: {
//         destination: vendor.stripe_account_id,
//       },
//     }
//   }

//   const session = await stripe.checkout.sessions.create(sessionOptions)

//   return session.client_secret
// }

// export async function getCheckoutSession(sessionId: string) {
//   const session = await stripe.checkout.sessions.retrieve(sessionId)
//   return {
//     status: session.status,
//     paymentStatus: session.payment_status,
//   }
// }

/////////// v2 ///////////

// "use server"

// import { createClient } from "@/lib/supabase/server"
// import { stripe, PLATFORM_FEE_PERCENT, isTestEnvironment } from "@/lib/stripe"
// import { redirect } from "next/navigation"

// interface CheckoutItem {
//   product_id: string
//   quantity: number
//   vendor_id: string
// }

// export async function createCheckoutSession(items: CheckoutItem[]) {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/checkout")
//   }

//   if (items.length === 0) {
//     throw new Error("Cart is empty")
//   }

//   // Get product details
//   const productIds = items.map((item) => item.product_id)
//   const { data: products } = await supabase.from("products").select("*, vendor:vendors(*)").in("id", productIds)

//   if (!products || products.length === 0) {
//     throw new Error("Products not found")
//   }

//   // Group items by vendor
//   const itemsByVendor = items.reduce(
//     (acc, item) => {
//       if (!acc[item.vendor_id]) {
//         acc[item.vendor_id] = []
//       }
//       acc[item.vendor_id].push(item)
//       return acc
//     },
//     {} as Record<string, CheckoutItem[]>,
//   )

//   // For simplicity, we'll process orders for each vendor separately
//   // In a real app, you might want to create a single checkout with transfers
//   const vendorIds = Object.keys(itemsByVendor)

//   if (vendorIds.length > 1) {
//     // Multiple vendors - redirect to multi-vendor checkout
//     // For now, we'll just use the first vendor
//     console.log("Multiple vendors detected, processing first vendor only")
//   }

//   const vendorId = vendorIds[0]
//   const vendorItems = itemsByVendor[vendorId]

//   // Get vendor's Stripe account
//   const { data: vendor } = await supabase.from("vendors").select("*").eq("id", vendorId).single()

//   if (!vendor) {
//     throw new Error("Vendor not found")
//   }

//   // Build line items for Stripe
//   const lineItems = vendorItems.map((item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     if (!product) {
//       throw new Error(`Product ${item.product_id} not found`)
//     }

//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: product.name,
//           description: product.description || undefined,
//           images: product.images?.length > 0 ? [product.images[0]] : undefined,
//         },
//         unit_amount: Math.round(product.price * 100), // Convert to cents
//       },
//       quantity: item.quantity,
//     }
//   })

//   // Calculate totals
//   const subtotal = vendorItems.reduce((total, item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     return total + (product ? product.price * item.quantity : 0)
//   }, 0)

//   const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100) * 100) // Fee in cents

//   // Create checkout session options with proper typing
//   const sessionOptions: any = {
//     mode: "payment",
//     ui_mode: "embedded",
//     redirect_on_completion: "never",
//     line_items: lineItems,
//     metadata: {
//       user_id: user.id,
//       vendor_id: vendorId,
//       items: JSON.stringify(
//         vendorItems.map((item) => ({
//           product_id: item.product_id,
//           quantity: item.quantity,
//         })),
//       ),
//     },
//     return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
//   }

//   // In test mode, allow payments without Stripe Connect
//   // In production, only use Connect if vendor has completed onboarding
//   const shouldUseConnect = vendor.stripe_account_id && vendor.stripe_onboarding_complete

//   if (shouldUseConnect || isTestEnvironment) {
//     sessionOptions.payment_intent_data = {
//       application_fee_amount: platformFee,
//       transfer_data: {
//         destination: vendor.stripe_account_id || 'acct_demo_vendor', // Fallback for demo
//       },
//     }
//   }

//   // Remove the fallback for undefined sessionOptions since we're initializing it properly
//   const session = await stripe.checkout.sessions.create(sessionOptions)

//   return session.client_secret
// }

// export async function getCheckoutSession(sessionId: string) {
//   const session = await stripe.checkout.sessions.retrieve(sessionId)
//   return {
//     status: session.status,
//     paymentStatus: session.payment_status,
//   }
// }

///////// v3 ///////////

// "use server"

// import { createClient } from "@/lib/supabase/server"
// import { stripe, PLATFORM_FEE_PERCENT, isTestEnvironment } from "@/lib/stripe"
// import { redirect } from "next/navigation"

// interface CheckoutItem {
//   product_id: string
//   quantity: number
//   vendor_id: string
// }

// // Store for test vendor accounts
// const TEST_VENDOR_ACCOUNTS: Record<string, string> = {}

// export async function createCheckoutSession(items: CheckoutItem[]) {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/auth/login?redirect=/checkout")
//   }

//   if (items.length === 0) {
//     throw new Error("Cart is empty")
//   }

//   // Get product details
//   const productIds = items.map((item) => item.product_id)
//   const { data: products } = await supabase.from("products").select("*, vendor:vendors(*)").in("id", productIds)

//   if (!products || products.length === 0) {
//     throw new Error("Products not found")
//   }

//   // Group items by vendor
//   const itemsByVendor = items.reduce(
//     (acc, item) => {
//       if (!acc[item.vendor_id]) {
//         acc[item.vendor_id] = []
//       }
//       acc[item.vendor_id].push(item)
//       return acc
//     },
//     {} as Record<string, CheckoutItem[]>,
//   )

//   // For simplicity, we'll process orders for each vendor separately
//   // In a real app, you might want to create a single checkout with transfers
//   const vendorIds = Object.keys(itemsByVendor)

//   if (vendorIds.length > 1) {
//     // Multiple vendors - redirect to multi-vendor checkout
//     // For now, we'll just use the first vendor
//     console.log("Multiple vendors detected, processing first vendor only")
//   }

//   const vendorId = vendorIds[0]
//   const vendorItems = itemsByVendor[vendorId]

//   // Get vendor's Stripe account
//   const { data: vendor } = await supabase.from("vendors").select("*").eq("id", vendorId).single()

//   if (!vendor) {
//     throw new Error("Vendor not found")
//   }

//   // Build line items for Stripe
//   const lineItems = vendorItems.map((item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     if (!product) {
//       throw new Error(`Product ${item.product_id} not found`)
//     }

//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: product.name,
//           description: product.description || undefined,
//           images: product.images?.length > 0 ? [product.images[0]] : undefined,
//         },
//         unit_amount: Math.round(product.price * 100), // Convert to cents
//       },
//       quantity: item.quantity,
//     }
//   })

//   // Calculate totals
//   const subtotal = vendorItems.reduce((total, item) => {
//     const product = products.find((p) => p.id === item.product_id)
//     return total + (product ? product.price * item.quantity : 0)
//   }, 0)

//   const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100) * 100) // Fee in cents

//   // Create checkout session options
//   const sessionOptions: any = {
//     mode: "payment",
//     ui_mode: "embedded",
//     redirect_on_completion: "never",
//     line_items: lineItems,
//     metadata: {
//       user_id: user.id,
//       vendor_id: vendorId,
//       items: JSON.stringify(
//         vendorItems.map((item) => ({
//           product_id: item.product_id,
//           quantity: item.quantity,
//         })),
//       ),
//     },
//     return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
//   }

//   // Check if we should use Stripe Connect or regular payments
//   const shouldUseConnect = vendor.stripe_account_id && vendor.stripe_onboarding_complete

//   if (shouldUseConnect) {
//     // Real Stripe Connect for onboarded vendors
//     sessionOptions.payment_intent_data = {
//       application_fee_amount: platformFee,
//       transfer_data: {
//         destination: vendor.stripe_account_id,
//       },
//     }
//   } else if (isTestEnvironment) {
//     // In test mode without Stripe Connect, use regular payments (no transfers)
//     // Don't add payment_intent_data - just create a regular checkout
//     console.log("Demo mode: Using regular payments without Stripe Connect")
    
//     // Optional: Store vendor share in metadata instead of transferring
//     const vendorShare = subtotal - (platformFee / 100)
//     sessionOptions.metadata = {
//       ...sessionOptions.metadata,
//       demo_mode: "true",
//       vendor_share: vendorShare.toString(),
//       platform_fee: (platformFee / 100).toString(),
//     }
//   }

//   const session = await stripe.checkout.sessions.create(sessionOptions)
//   console.log("Checkout session created:", session.id)

//   return session.client_secret
// }

// export async function getCheckoutSession(sessionId: string) {
//   const session = await stripe.checkout.sessions.retrieve(sessionId)
//   return {
//     status: session.status,
//     paymentStatus: session.payment_status,
//   }
// }

/////////// 4v //////////

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
    const product = products.find((p) => p.id === item.product_id)
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
  const subtotal = items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.product_id)
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