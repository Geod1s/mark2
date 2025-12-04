import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Discover unique products from independent vendors
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            A curated marketplace connecting you with quality goods from trusted sellers. Shop with confidence and
            support independent businesses.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/products">
              <Button size="lg" className="h-12 px-8 font-medium">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/become-vendor">
              <Button variant="outline" size="lg" className="h-12 px-8 font-medium bg-transparent">
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="text-3xl font-semibold">500+</p>
              <p className="mt-1 text-sm text-muted-foreground">Products</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">50+</p>
              <p className="mt-1 text-sm text-muted-foreground">Vendors</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">10k+</p>
              <p className="mt-1 text-sm text-muted-foreground">Customers</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">99%</p>
              <p className="mt-1 text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
