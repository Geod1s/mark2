import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { StoreSettings } from "@/components/dashboard/store-settings"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/settings")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  return (
    <DashboardLayout vendor={vendor}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">POS Settings</h2>
          <p className="text-muted-foreground">Update your POS information</p>
        </div>

        <StoreSettings vendor={vendor} />
      </div>
    </DashboardLayout>
  )
}
