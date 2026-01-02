import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single()

  if (!category) {
    notFound()
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name, slug)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All categories
          </Link>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
            {category.description && <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>}
          </div>

          {products && products.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <p className="text-muted-foreground">No products in this category yet</p>
              <Link href="/products" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
