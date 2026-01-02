import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

export async function GET() {
  try {
    // Add 'await' here
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Use NextResponse.redirect for API routes
      return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    if (!vendor?.stripe_account_id) {
      return NextResponse.redirect(new URL("/dashboard/payments?error=no_account", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    // Check the account status
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id)

    // Check if onboarding is complete
    if (account.charges_enabled && account.payouts_enabled) {
      await supabase
        .from("vendors")
        .update({ stripe_onboarding_complete: true })
        .eq("user_id", user.id)

      return NextResponse.redirect(new URL("/dashboard/payments?success=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    return NextResponse.redirect(new URL("/dashboard/payments?pending=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  } catch (error) {
    console.error("Stripe Connect callback error:", error)
    return NextResponse.redirect(new URL("/dashboard/payments?error=callback_failed", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }
}