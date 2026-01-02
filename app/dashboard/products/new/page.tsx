import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ProductForm } from "@/components/dashboard/product-form"
import { redirect } from "next/navigation"

export default async function NewProductPage() {
  const supabase = await createClient() // Add await here
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/products/new")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <DashboardLayout vendor={vendor}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Add Product</h2>
        <p className="text-muted-foreground">Create a new product listing</p>

        <div className="mt-8">
          <ProductForm vendorId={vendor.id} categories={categories || []} />
        </div>
      </div>
    </DashboardLayout>
  )
}