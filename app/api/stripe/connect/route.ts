import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Add 'await' here
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    let accountId = vendor.stripe_account_id

    // Create a new Stripe Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: vendor.store_name,
        },
      })

      accountId = account.id

      // Save the account ID to the vendor record
      await supabase
        .from("vendors")
        .update({ stripe_account_id: accountId })
        .eq("id", vendor.id)
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/connect/callback`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error("Stripe Connect error:", error)
    return NextResponse.json({ error: "Failed to create Stripe Connect account" }, { status: 500 })
  }
}