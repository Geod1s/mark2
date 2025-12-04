import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import type { Product, Vendor } from "@/lib/types"
import { ArrowRight } from "lucide-react"

interface FeaturedProductsProps {
  products: (Product & { vendor: Pick<Vendor, "id" | "store_name" | "slug"> | null })[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) {
    return (
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Products</h2>
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <p className="text-muted-foreground">No products available yet</p>
            <Link href="/become-vendor" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
              Become a vendor and add products
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Products</h2>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <Link
          href="/products"
          className="mt-8 flex sm:hidden items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
