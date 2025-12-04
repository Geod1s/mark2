import Link from "next/link"
import type { Vendor } from "@/lib/types"
import { ArrowRight, Store } from "lucide-react"

interface FeaturedVendorsProps {
  vendors: Vendor[]
}

export function FeaturedVendors({ vendors }: FeaturedVendorsProps) {
  if (vendors.length === 0) {
    return (
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Vendors</h2>
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Store className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No vendors yet</p>
            <Link href="/become-vendor" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
              Be the first to open a store
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
          <h2 className="text-2xl font-semibold tracking-tight">Featured Vendors</h2>
          <Link
            href="/vendors"
            className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-4">
                {vendor.logo_url ? (
                  <img
                    src={vendor.logo_url || "/placeholder.svg"}
                    alt={vendor.store_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary group-hover:bg-background transition-colors">
                    <Store className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{vendor.store_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">@{vendor.slug}</p>
                </div>
              </div>
              {vendor.description && (
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{vendor.description}</p>
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/vendors"
          className="mt-8 flex sm:hidden items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all vendors
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
