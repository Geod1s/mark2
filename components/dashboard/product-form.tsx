// components/dashboard/product-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  const [productionDate, setProductionDate] = useState(product?.production_date || "")
  const [expirationDate, setExpirationDate] = useState(product?.expiration_date || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Effect to ensure expiration date is not before production date
  useEffect(() => {
    if (productionDate && expirationDate) {
      const prodDate = new Date(productionDate);
      const expDate = new Date(expirationDate);

      if (expDate < prodDate) {
        // Set expiration date to production date if it's earlier
        setExpirationDate(productionDate);
        setError("Expiration date was adjusted to not be before production date.");
      } else {
        // Clear error if dates are valid (but only if it's related to date validation)
        if (error && error.includes("cannot be before")) {
          setError(null);
        }
      }
    }
  }, [productionDate, error]);

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

    // Validate date range: expiration date should not be before production date
    if (productionDate && expirationDate) {
      const prodDate = new Date(productionDate);
      const expDate = new Date(expirationDate);

      if (expDate < prodDate) {
        setError("Expiration date cannot be before production date.");
        setIsLoading(false);
        return;
      }
    }

    // Additional validation: if only one date is provided, we might want to validate further
    // For now, we'll allow having just one of the dates

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
      const productData: any = {
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

      // Only add date fields if they have values (to avoid database errors if columns don't exist yet)
      if (productionDate) {
        productData.production_date = productionDate;
      }
      if (expirationDate) {
        productData.expiration_date = expirationDate;
      }

      console.log("Product data to send:", productData)

      if (product) {
        // For update, remove slug and keep original
        const updateData: any = { ...productData };
        delete updateData.slug;

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

          // If the error is due to unknown columns, try updating without the date fields
          if (error.message && (error.message.includes('production_date') || error.message.includes('expiration_date'))) {
            // Create update data without date fields
            const updateDataWithoutDates: any = { ...updateData };
            delete updateDataWithoutDates.production_date;
            delete updateDataWithoutDates.expiration_date;

            console.log("Retrying update without date fields:", updateDataWithoutDates);

            const { data: retryData, error: retryError } = await supabase
              .from("products")
              .update(updateDataWithoutDates)
              .eq("id", product.id)
              .select()

            if (retryError) {
              console.error("Retry update also failed:", retryError)
              setError(`Failed to update product: ${retryError.message}`)
              setIsLoading(false)
              return
            }

            console.log("Retry update successful:", retryData);
          } else {
            setError(`Failed to update product: ${error.message}`)
            setIsLoading(false)
            return
          }
        }

        console.log("Update successful, data returned:", data)
      } else {
        // Create new product with unique slug
        let { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()

        console.log("Create response:", { data, error })

        if (error) {
          console.error("Create error details:", error);

          // If the error is due to unknown columns, try inserting without the date fields
          if (error.message && (error.message.includes('production_date') || error.message.includes('expiration_date'))) {
            // Create insert data without date fields
            const insertDataWithoutDates: any = { ...productData };
            delete insertDataWithoutDates.production_date;
            delete insertDataWithoutDates.expiration_date;

            console.log("Retrying insert without date fields:", insertDataWithoutDates);

            const result = await supabase
              .from("products")
              .insert(insertDataWithoutDates)
              .select()

            data = result.data;
            error = result.error;

            if (error) {
              console.error("Retry insert also failed:", error)
              setError(`Failed to create product: ${error.message}`)
              setIsLoading(false)
              return
            }

            console.log("Retry insert successful:", data);
          }
          // If still getting duplicate, try with timestamp
          else if (error.code === "23505" && error.message.includes("slug")) {
            const timestamp = Date.now()
            const fallbackSlug = `${generateSlug(name)}-${timestamp}`

            const { error: retryError } = await supabase
              .from("products")
              .insert({
                ...productData,
                slug: fallbackSlug
              } as any)

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
          className="min-h-[120px]  resize-none"
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
             
            />
          </div>
        </div>

        {/* <div className="space-y-2">
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
             
            />
          </div>
        </div> */}
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
           
          />
          {product && (
            <p className="text-xs text-muted-foreground">
              Current stock: {stockQuantity} units
            </p>
          )}
        </div>

        <div className="space-y-2 ">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="w-56 bg-black text-white border-zinc-800 ">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="productionDate">Production Date</Label>
          <Input
            id="productionDate"
            type="date"
            value={productionDate}
            onChange={(e) => {
              const newProductionDate = e.target.value;
              setProductionDate(newProductionDate);

              // If expiration date exists and is before new production date, clear it or adjust it
              if (expirationDate && newProductionDate) {
                const newProdDate = new Date(newProductionDate);
                const expDate = new Date(expirationDate);

                if (expDate < newProdDate) {
                  // Automatically set expiration date to production date if it's invalid
                  setExpirationDate(newProductionDate);
                  setError(null); // Clear any error since we're auto-correcting
                }
              }
            }}
            
          />
          <p className="text-xs text-muted-foreground">
            Date when the product was manufactured/produced
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => {
              const newExpirationDate = e.target.value;
              if (productionDate && newExpirationDate) {
                const prodDate = new Date(productionDate);
                const expDate = new Date(newExpirationDate);

                if (expDate < prodDate) {
                  setError("Expiration date cannot be before production date.");
                  return;
                } else {
                  // Clear the error if dates are valid (but only if it's related to date validation)
                  if (error && error.includes("cannot be before")) {
                    setError(null);
                  }
                }
              }
              setExpirationDate(newExpirationDate);
            }}
            min={productionDate} // Set minimum date to production date
          
          />
          <p className="text-xs text-muted-foreground">
            Date when the product expires/should not be used after
          </p>
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