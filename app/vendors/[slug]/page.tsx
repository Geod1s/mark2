import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { notFound } from "next/navigation"
import { Store, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface VendorPageProps {
  params: Promise<{ slug: string }>
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: vendor } = await supabase.from("vendors").select("*").eq("slug", slug).eq("is_active", true).single()

  if (!vendor) {
    notFound()
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name, slug)")
    .eq("vendor_id", vendor.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Banner */}
        {vendor.banner_url && (
          <div className="h-48 bg-secondary overflow-hidden">
            <img src={vendor.banner_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All vendors
          </Link>

          {/* Vendor Info */}
          <div className="flex items-start gap-6">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url || "/placeholder.svg"}
                alt={vendor.store_name}
                className="h-20 w-20 rounded-full object-cover border-4 border-background"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary border-4 border-background">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight">{vendor.store_name}</h1>
              <p className="mt-1 text-muted-foreground">@{vendor.slug}</p>
              {vendor.description && <p className="mt-4 text-muted-foreground max-w-2xl">{vendor.description}</p>}
            </div>
          </div>

          {/* Products */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold">Products ({products?.length || 0})</h2>

            {products && products.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                <p className="text-muted-foreground">No products yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
