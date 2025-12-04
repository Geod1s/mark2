import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return redirect("/auth/login")
    }

    const { data: vendor } = await supabase.from("vendors").select("stripe_account_id").eq("user_id", user.id).single()

    if (!vendor?.stripe_account_id) {
      return redirect("/dashboard/payments?error=no_account")
    }

    // Check the account status
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id)

    // Check if onboarding is complete
    if (account.charges_enabled && account.payouts_enabled) {
      await supabase.from("vendors").update({ stripe_onboarding_complete: true }).eq("user_id", user.id)

      return redirect("/dashboard/payments?success=true")
    }

    return redirect("/dashboard/payments?pending=true")
  } catch (error) {
    console.error("Stripe Connect callback error:", error)
    return redirect("/dashboard/payments?error=callback_failed")
  }
}
