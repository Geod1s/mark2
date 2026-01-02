// app/page.tsx - Updated without Header/Footer
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { FeaturedVendors } from "@/components/home/featured-vendors"
import BecomeVendorPage from "./become-vendor/page"

export default async function HomePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user || null

  // If not authenticated, redirect to login page
  if (error || !user) {
    redirect('/auth/login')
  }

  const categoriesQuery = supabase.from("categories").select("*").limit(8) as any
  const productsQuery = supabase.from("products").select("*, vendor:vendors(id, store_name, slug)").eq("is_active", true).limit(8) as any
  const vendorsQuery = supabase.from("vendors").select("*").eq("is_active", true).limit(4) as any

  const [categoriesResult, productsResult, vendorsResult] = await Promise.all([
    categoriesQuery,
    productsQuery,
    vendorsQuery,
  ])

  const categories = categoriesResult.data || []
  const products = productsResult.data || []
  const vendors = vendorsResult.data || []

  return (
    <>
      <BecomeVendorPage />
      {/* <HeroSection />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={products} />
      <FeaturedVendors vendors={vendors} /> */}
    </>
  )
}