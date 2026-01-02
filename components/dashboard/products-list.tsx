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

// Accept vendor thresholds so the list highlights low/overstock according to vendor settings
interface ProductsListPropsWithThresholds extends ProductsListProps {
  lowStockThreshold?: number
  overstockThreshold?: number
}

// Helper function to check if expiration date has passed
const isExpired = (expirationDate: string): boolean => {
  const today = new Date()
  const expDate = new Date(expirationDate)
  return expDate < today
}

// Helper function to format date consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function ProductsList({ products: initialProducts, vendorId, lowStockThreshold = 10, overstockThreshold = 100 }: ProductsListPropsWithThresholds) {
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
            <TableHead>Expiration Date</TableHead>
            <TableHead>Status</TableHead>
            {/* <TableHead>SL</TableHead> */}
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
                  {stockQuantity < lowStockThreshold && stockQuantity > 0 && (
                    <span className="ml-1 text-xs text-amber-500">(Low stock)</span>
                  )}
                  {stockQuantity >= overstockThreshold && (
                    <span className="ml-1 text-xs text-sky-600">(Overstock)</span>
                  )}
                  {stockQuantity === 0 && (
                    <span className="ml-1 text-xs text-red-500">(Out of stock)</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.expiration_date ? (
                    <span className={
                      isExpired(product.expiration_date)
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground"
                    }>
                      {formatDate(product.expiration_date)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
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
                    <DropdownMenuContent
                      align="end"
                      className="bg-black text-white border-zinc-800"
                    >
                      {/* Edit */}
                      <DropdownMenuItem
                        asChild
                        className="flex items-center justify-center gap-2 focus:bg-transparent focus:text-white cursor-pointer"
                      >
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="flex items-center justify-center gap-2 w-full"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>

                      {/* Toggle Active */}
                      <DropdownMenuItem
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className="flex items-center justify-center gap-2 focus:bg-transparent focus:text-white cursor-pointer"
                      >
                        {product.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>

                      {/* Delete */}
                      <DropdownMenuItem
                        onClick={() => deleteProduct(product.id)}
                        className="flex items-center justify-center gap-2 text-red-500 focus:bg-transparent focus:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
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