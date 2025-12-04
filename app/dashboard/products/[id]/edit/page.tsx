import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ProductForm } from "@/components/dashboard/product-form"
import { redirect, notFound } from "next/navigation"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
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

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .maybeSingle()

  if (!product) {
    notFound()
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <DashboardLayout vendor={vendor}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Edit Product</h2>
        <p className="text-muted-foreground">Update your product details</p>

        <div className="mt-8">
          <ProductForm vendorId={vendor.id} categories={categories || []} product={product} />
        </div>
      </div>
    </DashboardLayout>
  )
}
