import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductDetails } from "@/components/products/product-details"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, vendor:vendors(*), category:categories(*)")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!product) {
    notFound()
  }

  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name, slug)")
    .eq("is_active", true)
    .eq("vendor_id", product.vendor_id)
    .neq("id", id)
    .limit(4)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ProductDetails product={product} relatedProducts={relatedProducts || []} />
      </main>
      <Footer />
    </div>
  )
}
