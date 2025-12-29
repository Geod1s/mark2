import Link from "next/link"
import { InventoryAlert } from "./inventory-alert"
import type { Product, Vendor } from "@/lib/types"

interface ProductCardProps {
  product: Product & { vendor?: Pick<Vendor, "id" | "store_name" | "slug"> | null }
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.images?.[0] || `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(product.name)}`
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const inventoryCount = product.inventory_count || 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-colors hover:bg-secondary/50"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 rounded bg-foreground px-2 py-1 text-xs font-medium text-background">
            Sale
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <InventoryAlert inventoryCount={inventoryCount} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.vendor && <p className="text-xs text-muted-foreground mb-1">{product.vendor.store_name}</p>}
        <h3 className="font-medium line-clamp-2 leading-snug">{product.name}</h3>

        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">${product.compare_at_price!.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
