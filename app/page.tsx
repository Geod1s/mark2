import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { FeaturedVendors } from "@/components/home/featured-vendors"
import { Footer } from "@/components/footer"

export default async function HomePage() {
  const supabase = await createClient()

  const [categoriesResult, productsResult, vendorsResult] = await Promise.all([
    supabase.from("categories").select("*").limit(8),
    supabase.from("products").select("*, vendor:vendors(id, store_name, slug)").eq("is_active", true).limit(8),
    supabase.from("vendors").select("*").eq("is_active", true).limit(4),
  ])

  const categories = categoriesResult.data || []
  const products = productsResult.data || []
  const vendors = vendorsResult.data || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* <HeroSection /> */}
        <CategoriesSection categories={categories} />
        <FeaturedProducts products={products} />
        <FeaturedVendors vendors={vendors} />
      </main>
      {/* <Footer /> */}
    </div>
  )
}
