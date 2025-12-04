"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { CartItem, Product, Vendor } from "@/lib/types"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"

type CartItemWithProduct = CartItem & {
  product: (Product & { vendor: Pick<Vendor, "id" | "store_name" | "slug"> | null }) | null
}

interface CartItemsProps {
  initialItems: CartItemWithProduct[]
}

export function CartItems({ initialItems }: CartItemsProps) {
  const [items, setItems] = useState(initialItems)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdating(itemId)

    const supabase = createClient()
    const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

    if (!error) {
      setItems(items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    }

    setUpdating(null)
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)

    const supabase = createClient()
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

    if (!error) {
      setItems(items.filter((item) => item.id !== itemId))
    }

    setUpdating(null)
  }

  const subtotal = items.reduce((total, item) => {
    if (!item.product) return total
    return total + item.product.price * item.quantity
  }, 0)

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Your cart is empty</p>
        <Link href="/products" className="mt-4">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => {
          if (!item.product) return null
          const imageUrl =
            item.product.images?.[0] ||
            `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(item.product.name)}`

          return (
            <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <Link href={`/products/${item.product.id}`} className="shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-md bg-secondary">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-medium hover:underline line-clamp-1">{item.product.name}</h3>
                    </Link>
                    {item.product.vendor && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.product.vendor.store_name}</p>
                    )}
                  </div>
                  <p className="font-semibold shrink-0">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="rounded-lg border border-border bg-card p-6 sticky top-24">
          <h2 className="font-semibold">Order Summary</h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-semibold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/checkout" className="mt-6 block">
            <Button className="w-full h-12 font-medium">Proceed to Checkout</Button>
          </Link>

          <Link href="/products" className="mt-4 block">
            <Button variant="outline" className="w-full bg-transparent">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
