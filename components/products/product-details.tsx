"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import type { Product, Vendor, Category } from "@/lib/types"
import { Minus, Plus, ShoppingCart, Store, ArrowLeft } from "lucide-react"

interface ProductDetailsProps {
  product: Product & { vendor: Vendor | null; category: Category | null }
  relatedProducts: (Product & { vendor: Pick<Vendor, "id" | "store_name" | "slug"> | null })[]
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const imageUrl =
    product.images?.[0] || `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name)}`
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  const handleAddToCart = async () => {
    setIsAdding(true)
    setMessage(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/login?redirect=/products/${product.id}`)
      return
    }

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single()

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id)

      if (error) {
        setMessage({ type: "error", text: "Failed to update cart" })
      } else {
        setMessage({ type: "success", text: "Cart updated!" })
      }
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity,
      })

      if (error) {
        setMessage({ type: "error", text: "Failed to add to cart" })
      } else {
        setMessage({ type: "success", text: "Added to cart!" })
      }
    }

    setIsAdding(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
          <img src={imageUrl || "/placeholder.svg"} alt={product.name} className="h-full w-full object-cover" />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.vendor && (
            <Link
              href={`/vendors/${product.vendor.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <Store className="h-4 w-4" />
              {product.vendor.store_name}
            </Link>
          )}

          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>

          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
                ${product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {product.description && <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>}

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.inventory_count}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">{product.inventory_count} in stock</span>
            </div>

            <Button
              size="lg"
              className="h-12 font-medium"
              onClick={handleAddToCart}
              disabled={isAdding || product.inventory_count === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAdding ? "Adding..." : product.inventory_count === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-destructive"}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-border pt-16">
          <h2 className="text-2xl font-semibold tracking-tight">More from this vendor</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
