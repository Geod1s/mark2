import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/products/product-filters"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name, slug), category:categories(id, name, slug)")
    .eq("is_active", true)

  if (params.category) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", params.category).single()

    if (category) {
      query = query.eq("category_id", category.id)
    }
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`)
  }

  if (params.sort === "price-asc") {
    query = query.order("price", { ascending: true })
  } else if (params.sort === "price-desc") {
    query = query.order("price", { ascending: false })
  } else if (params.sort === "newest") {
    query = query.order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data: products } = await query
  const { data: categories } = await supabase.from("categories").select("*")

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
              <p className="mt-1 text-muted-foreground">{products?.length || 0} products available</p>
            </div>
          </div>

          <ProductFilters categories={categories || []} />

          {products && products.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
