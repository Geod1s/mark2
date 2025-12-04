import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ProductsList } from "@/components/dashboard/products-list"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/products")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <ProductsList products={products || []} vendorId={vendor.id} />
      </div>
    </DashboardLayout>
  )
}
