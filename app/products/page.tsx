import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { InventoryDashboard } from "@/components/inventory-dashboard"
import { InventoryTrigger } from "@/components/inventory-trigger"
import { InventoryNotifications } from "@/components/inventory-notifications"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string; inventory?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get all products for inventory dashboard
  const { data: allProducts } = await supabase
    .from("products")
    .select("inventory_count")
    .eq("is_active", true)

  // Calculate inventory metrics
  const totalProducts = allProducts?.length || 0
  const outOfStockCount = allProducts?.filter(p => (p.inventory_count || 0) <= 0).length || 0
  const lowStockCount = allProducts?.filter(p => (p.inventory_count || 0) > 0 && (p.inventory_count || 0) <= 5).length || 0
  const overstockCount = allProducts?.filter(p => (p.inventory_count || 0) >= 100).length || 0

  let query = supabase
    .from("products")
    .select("*, vendor:vendors(id, store_name, slug), category:categories(id, name, slug)")
    .eq("is_active", true)

  // Apply category filter
  if (params.category) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", params.category).single()

    if (category) {
      query = query.eq("category_id", category.id)
    }
  }

  // Apply search filter
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`)
  }

  // Apply inventory status filter
  if (params.inventory) {
    switch (params.inventory) {
      case 'in-stock':
        query = query.gt('inventory_count', 0).lt('inventory_count', 100) // Assuming 100 is overstock threshold
        break
      case 'low-stock':
        query = query.lte('inventory_count', 5).gt('inventory_count', 0) // Assuming 5 is low stock threshold
        break
      case 'out-of-stock':
        query = query.lte('inventory_count', 0)
        break
      case 'overstock':
        query = query.gte('inventory_count', 100) // Assuming 100 is overstock threshold
        break
      default:
        break
    }
  }

  // Apply sorting
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
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
            <p className="mt-1 text-muted-foreground">Manage your inventory and product catalog</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <InventoryDashboard
                totalProducts={totalProducts}
                outOfStockCount={outOfStockCount}
                lowStockCount={lowStockCount}
                overstockCount={overstockCount}
              />
            </div>
            <div>
              <InventoryTrigger
                initialLowStockThreshold={5}
                initialOverstockThreshold={100}
              />
            </div>
          </div>

          <div className="mb-8">
            <InventoryNotifications />
          </div>

          <div className="mt-8">
            <ProductFilters categories={categories || []} />
          </div>

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
