// components/dashboard/product-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category, Product } from "@/lib/types"

interface ProductFormProps {
  vendorId: string
  categories: Category[]
  product?: Product
}

export function ProductForm({ vendorId, categories, product }: ProductFormProps) {
  const router = useRouter()
  
  // Initialize with product data if available, otherwise empty defaults
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compare_at_price?.toString() || "")
  // Changed from inventory_count to stock_quantity
  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity !== undefined ? product.stock_quantity.toString() : "0"
  )
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enhanced slug generation function
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  // Function to generate a unique slug
  const generateUniqueSlug = async (baseName: string): Promise<string> => {
    const supabase = createClient()
    let baseSlug = generateSlug(baseName)
    let finalSlug = baseSlug
    let counter = 1
    
    // If editing existing product, keep its slug
    if (product?.slug) {
      return product.slug
    }

    // Check if slug exists globally
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle()

    // If slug doesn't exist, use it
    if (!existing) {
      return finalSlug
    }

    // Try with vendor-specific prefix
    const { data: vendor } = await supabase
      .from("vendors")
      .select("business_name, store_name")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendor?.business_name || vendor?.store_name) {
      const vendorName = vendor.business_name || vendor.store_name
      const vendorSlug = generateSlug(vendorName)
      finalSlug = `${vendorSlug}-${baseSlug}`
      
      const { data: checkVendorSlug } = await supabase
        .from("products")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle()

      if (!checkVendorSlug) {
        return finalSlug
      }
    }

    // Try with incrementing number
    while (counter <= 100) {
      finalSlug = `${baseSlug}-${counter}`
      const { data: check } = await supabase
        .from("products")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle()

      if (!check) {
        return finalSlug
      }
      counter++
    }

    // Last resort: add timestamp
    const timestamp = Date.now().toString().slice(-6)
    return `${baseSlug}-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Log the data being sent for debugging
      console.log("Form data being submitted:", {
        name,
        description,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stockQuantity: parseInt(stockQuantity),
        categoryId,
        imageUrl,
        productId: product?.id,
        isUpdate: !!product
      })

      // Generate unique slug for new products
      const uniqueSlug = product?.slug || await generateUniqueSlug(name)

      // Build product data object - CHANGED inventory_count to stock_quantity
      const productData = {
        vendor_id: vendorId,
        name,
        slug: uniqueSlug,
        description: description || null,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock_quantity: parseInt(stockQuantity) || 0, // CHANGED: inventory_count → stock_quantity
        category_id: categoryId || null,
        images: imageUrl ? [imageUrl] : [],
        updated_at: new Date().toISOString()
      }

      console.log("Product data to send:", productData)

      if (product) {
        // For update, remove slug and keep original
        const { slug, ...updateData } = productData
        
        console.log("Update data (without slug):", updateData)
        console.log("Updating product ID:", product.id)
        
        const { data, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", product.id)
          .select() // Add select to see what's returned

        console.log("Update response:", { data, error })

        if (error) {
          console.error("Update error details:", error)
          setError(`Failed to update product: ${error.message}`)
          setIsLoading(false)
          return
        }

        console.log("Update successful, data returned:", data)
      } else {
        // Create new product with unique slug
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()

        console.log("Create response:", { data, error })

        if (error) {
          // If still getting duplicate, try with timestamp
          if (error.code === "23505" && error.message.includes("slug")) {
            const timestamp = Date.now()
            const fallbackSlug = `${generateSlug(name)}-${timestamp}`
            
            const { error: retryError } = await supabase
              .from("products")
              .insert({
                ...productData,
                slug: fallbackSlug
              })

            if (retryError) {
              setError("Failed to create product. Please try a different name.")
              setIsLoading(false)
              return
            }
          } else {
            setError(`Failed to create product: ${error.message}`)
            setIsLoading(false)
            return
          }
        }
      }

      console.log("Operation successful, redirecting...")
      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Debug info - remove in production */}
      {product && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          <p>Editing Product ID: {product.id}</p>
          {/* CHANGED: inventory_count → stock_quantity */}
          <p>Current Stock: {product.stock_quantity !== undefined ? product.stock_quantity : product.inventory_count}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name"
          className="bg-secondary border-0"
        />
        {!product && (
          <p className="text-xs text-muted-foreground">
            If a product with this name already exists, a unique identifier will be added to the URL.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product"
          className="min-h-[120px] bg-secondary border-0 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="pl-7 bg-secondary border-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">Compare at Price (Optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="0.00"
              className="pl-7 bg-secondary border-0"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            required
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="bg-secondary border-0"
          />
          {product && (
            <p className="text-xs text-muted-foreground">
              Current stock: {stockQuantity} units
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-secondary border-0">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="bg-secondary border-0"
        />
        <p className="text-xs text-muted-foreground">
          Enter an image URL. For production, integrate with Vercel Blob or similar.
        </p>
      </div>

      {error && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}