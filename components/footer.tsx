import Link from "next/link"
import { Store } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span className="font-semibold">Marketplace</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              A curated marketplace for unique products from independent vendors.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Shop</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Vendors
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Sell</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/become-vendor"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vendor Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Support</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
