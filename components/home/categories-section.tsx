import Link from "next/link"
import type { Category } from "@/lib/types"
import { ArrowRight } from "lucide-react"

interface CategoriesSectionProps {
  categories: Category[]
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) {
    return (
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="mt-4 text-muted-foreground">Categories coming soon...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative flex flex-col items-center rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary group-hover:bg-background transition-colors">
                <span className="text-xl">{getCategoryIcon(category.slug)}</span>
              </div>
              <h3 className="mt-4 text-sm font-medium text-center">{category.name}</h3>
            </Link>
          ))}
        </div>

        <Link
          href="/categories"
          className="mt-6 flex sm:hidden items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
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
