"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Product, Category } from "@/lib/types"
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Package } from "lucide-react"

type ProductWithCategory = Product & { category: Pick<Category, "name"> | null }

interface ProductsListProps {
  products: ProductWithCategory[]
  vendorId: string
}

export function ProductsList({ products: initialProducts, vendorId }: ProductsListProps) {
  const [products, setProducts] = useState(initialProducts)
  const [deleting, setDeleting] = useState<string | null>(null)

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from("products").update({ is_active: !currentStatus }).eq("id", productId)

    if (!error) {
      setProducts(products.map((p) => (p.id === productId ? { ...p, is_active: !currentStatus } : p)))
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    setDeleting(productId)
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (!error) {
      setProducts(products.filter((p) => p.id !== productId))
    }
    setDeleting(null)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No products yet</p>
        <Link href="/dashboard/products/new" className="mt-4">
          <Button>Add your first product</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const imageUrl =
              product.images?.[0] || `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(product.name)}`
            
            // Use stock_quantity instead of inventory_count
            const stockQuantity = product.stock_quantity !== undefined ? product.stock_quantity : 0

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="h-10 w-10 overflow-hidden rounded bg-secondary">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category?.name || "-"}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={stockQuantity > 0 ? "font-medium" : "text-red-500 font-medium"}>
                    {stockQuantity}
                  </span>
                  {stockQuantity < 10 && stockQuantity > 0 && (
                    <span className="ml-1 text-xs text-amber-500">(Low stock)</span>
                  )}
                  {stockQuantity === 0 && (
                    <span className="ml-1 text-xs text-red-500">(Out of stock)</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      product.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={deleting === product.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/products/${product.id}`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(product.id, product.is_active)}>
                        {product.is_active ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteProduct(product.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}