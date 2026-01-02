import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { PaymentsSetup } from "@/components/dashboard/payments-setup"
import { redirect } from "next/navigation"

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/pos")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  // Fetch vendor's products for POS
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("vendor_id", vendor.id)
    .eq("is_active", true)
    .order("name", { ascending: true })
  return (
    <DashboardLayout vendor={vendor}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">Manage your payment settings</p>
        </div>

        <PaymentsSetup vendor={vendor} />
      </div>
    </DashboardLayout>
  )
}
