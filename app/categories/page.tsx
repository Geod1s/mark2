import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default async function CategoriesPage() {
  const supabase = createClient()
  const { data: categories } = await supabase.from("categories").select("*").order("name", { ascending: true })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
            <p className="mt-1 text-muted-foreground">Browse products by category</p>
          </div>

          {categories && categories.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative flex flex-col items-center rounded-lg border border-border bg-card p-8 transition-colors hover:bg-secondary"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary group-hover:bg-background transition-colors">
                    <span className="text-2xl">{getCategoryIcon(category.slug)}</span>
                  </div>
                  <h3 className="mt-4 font-medium text-center">{category.name}</h3>
                  {category.description && (
                    <p className="mt-2 text-sm text-muted-foreground text-center line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <p className="text-muted-foreground">No categories available</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    electronics: "⚡",
    clothing: "👕",
    "home-garden": "🏠",
    "sports-outdoors": "⚽",
    "beauty-health": "✨",
    "books-media": "📚",
    "toys-games": "🎮",
    "food-beverages": "🍕",
  }
  return icons[slug] || "📦"
}
