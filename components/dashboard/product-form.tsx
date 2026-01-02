// components/dashboard/product-form.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarcodeScanner } from "@/components/barcode-scanner"
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
  const [price, setPrice] = useState<string>(product?.price?.toString() || "")
  const [compareAtPrice, setCompareAtPrice] = useState<string>(product?.compare_at_price !== null && product?.compare_at_price !== undefined ? product.compare_at_price.toString() : "")
  const [sku, setSku] = useState(product?.sku || "")
  const [barcode, setBarcode] = useState(product?.barcode || "")
  // Changed from inventory_count to stock_quantity
  const [stockQuantity, setStockQuantity] = useState<string>(
    product?.stock_quantity !== undefined ? product.stock_quantity.toString() : "0"
  )
  const [categoryId, setCategoryId] = useState<string>(product?.category_id || "")
  const [imageUrl, setImageUrl] = useState<string>(product?.images?.[0] || "")
  const [productionDate, setProductionDate] = useState<string>(product?.production_date || "")
  const [expirationDate, setExpirationDate] = useState<string>(product?.expiration_date || "")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState<boolean>(false)

  // Refs for barcode scanning UX: the scanner sends the barcode then usually an Enter.
  // We catch Enter on the barcode input and then move focus to the next field.
  const barcodeRef = useRef<HTMLInputElement | null>(null)
  const stockRef = useRef<HTMLInputElement | null>(null)

  // Effect to ensure expiration date is not before production date
  useEffect(() => {
    if (productionDate && expirationDate) {
      try {
        const prodDate = new Date(productionDate);
        const expDate = new Date(expirationDate);

        if (isNaN(prodDate.getTime()) || isNaN(expDate.getTime())) {
          setError("Invalid date format provided.");
          return;
        }

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
      } catch (dateError) {
        console.error("Date validation error:", {
          message: dateError instanceof Error ? dateError.message : 'Unknown date error',
          productionDate,
          expirationDate
        });
        setError("Invalid date format provided.");
      }
    }
  }, [productionDate, expirationDate, error]);

  // Enhanced slug generation function
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  // Handle Enter pressed while barcode input is focused (scanner emulates keyboard)
  const handleBarcodeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const code = (e.currentTarget.value || "").trim()
      if (code) {
        setBarcode(code)
        // Slight delay to ensure any native input update finishes, then move focus
        setTimeout(() => {
          stockRef.current?.focus()
        }, 50)
      }
    }
  }

  const handleScannedBarcode = (code: string) => {
    const trimmed = (code || "").trim()
    if (!trimmed) return
    setBarcode(trimmed)
    // Move focus to stock quantity after scanning
    setTimeout(() => stockRef.current?.focus(), 50)
    setScannerOpen(false)
  }

  // Auto-focus barcode field when creating a new product (helpful for scanning)
  useEffect(() => {
    if (!product) {
      // Give the page a moment to render, then focus and select the barcode input
      const t = setTimeout(() => {
        try {
          barcodeRef.current?.focus()
          // Select text if supported
          // @ts-ignore
          barcodeRef.current?.select?.()
        } catch (err) {
          // ignore focus errors
        }
      }, 120)

      return () => clearTimeout(t)
    }
  }, [product])

  // Function to generate a unique slug
  const generateUniqueSlug = async (baseName: string): Promise<string> => {
    try {
      const supabase = createClient()
      let baseSlug = generateSlug(baseName)
      let finalSlug = baseSlug
      let counter = 1

      // If editing existing product, keep its slug
      if (product?.slug) {
        return product.slug
      }

      // Check if slug exists globally
      const { data: existing, error: existingError } = await supabase
        .from("products")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle()

      if (existingError) {
        console.error("Error checking existing slug:", {
          message: existingError.message || 'No error message',
          code: existingError.code || 'No error code',
          details: existingError.details || 'No error details'
        });
        // Return a fallback slug with timestamp
        const timestamp = Date.now().toString().slice(-6)
        return `${baseSlug}-${timestamp}`
      }

      // If slug doesn't exist, use it
      if (!existing) {
        return finalSlug
      }

      // Try with vendor-specific prefix
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        // 'business_name' column does not exist in schema; use 'store_name'
        .select("store_name")
        .eq("id", vendorId)
        .maybeSingle()

      if (vendorError) {
        // vendorError may be an empty object or have different shape depending on
        // the Supabase client runtime. Safely stringify to avoid logging `{}`
        // unhelpful messages and provide a concise fallback.
        try {
          const serialized = typeof vendorError === 'object' ? JSON.stringify(vendorError) : String(vendorError)
          if (serialized && serialized !== '{}' && serialized !== 'null') {
            console.error('Error fetching vendor data:', serialized)
          } else {
            console.warn('Error fetching vendor data: unknown error object', vendorError)
          }
        } catch (err) {
          console.error('Error fetching vendor data (unable to serialize error):', vendorError)
        }
      } else if (vendor?.store_name) {
        const vendorName = vendor.store_name
        const vendorSlug = generateSlug(vendorName)
        finalSlug = `${vendorSlug}-${baseSlug}`

        const { data: checkVendorSlug, error: vendorSlugError } = await supabase
          .from("products")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle()

        if (vendorSlugError) {
          console.error("Error checking vendor slug:", {
            message: vendorSlugError.message || 'No error message',
            code: vendorSlugError.code || 'No error code',
            details: vendorSlugError.details || 'No error details'
          });
        } else if (!checkVendorSlug) {
          return finalSlug
        }
      }

      // Try with incrementing number
      while (counter <= 100) {
        finalSlug = `${baseSlug}-${counter}`
        const { data: check, error: checkError } = await supabase
          .from("products")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle()

        if (checkError) {
          console.error("Error checking incremental slug:", {
            message: checkError.message || 'No error message',
            code: checkError.code || 'No error code',
            details: checkError.details || 'No error details'
          });
        } else if (!check) {
          return finalSlug
        }
        counter++
      }

      // Last resort: add timestamp
      const timestamp = Date.now().toString().slice(-6)
      return `${baseSlug}-${timestamp}`
    } catch (error) {
      console.error("Unexpected error in slug generation:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error
      });
      // Return a fallback slug with timestamp
      const timestamp = Date.now().toString().slice(-6)
      return `${generateSlug(baseName)}-${timestamp}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate date range: expiration date should not be before production date
    if (productionDate && expirationDate) {
      try {
        const prodDate = new Date(productionDate);
        const expDate = new Date(expirationDate);

        if (isNaN(prodDate.getTime()) || isNaN(expDate.getTime())) {
          setError("Invalid date format provided.");
          setIsLoading(false);
          return;
        }

        if (expDate < prodDate) {
          setError("Expiration date cannot be before production date.");
          setIsLoading(false);
          return;
        }
      } catch (dateError) {
        console.error("Date validation error in submit:", {
          message: dateError instanceof Error ? dateError.message : 'Unknown date error',
          productionDate,
          expirationDate
        });
        setError("Invalid date format provided.");
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
        sku: sku || null,
        barcode: barcode || null,
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
  console.error("Update error details:", {
    message: error.message || 'No error message',
    code: error.code || 'No error code',
    details: error.details || 'No error details',
    hint: error.hint || 'No error hint'
  });
  
  // Log the full error for debugging
  console.error("Full error:", JSON.stringify(error, null, 2));
  
  setError(`Failed to update product: ${error.message || 'Unknown error'}`);
  setIsLoading(false);
  return;
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
          console.error("Create error details:", {
            message: error.message || 'No error message',
            code: error.code || 'No error code',
            details: error.details || 'No error details',
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
          });

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
              console.error("Retry insert also failed:", {
                message: error.message || 'No error message',
                code: error.code || 'No error code',
                details: error.details || 'No error details'
              });
              setError(`Failed to create product: ${error.message || 'Unknown error'}`)
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
            setError(`Failed to create product: ${error.message || 'Unknown error'}`)
            setIsLoading(false)
            return
          }
        }
      }

      console.log("Operation successful, redirecting...")
      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      console.error("Unexpected error:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        error: err
      });
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
          className="min-h-30 resize-none"
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
          <Label htmlFor="sku">SKU</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></span>
            <Input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Enter SKU"

            />
          </div>
        </div> */}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></span>
              <Input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                ref={barcodeRef}
                onKeyDown={handleBarcodeInputKeyDown}
                placeholder="Enter product barcode (UPC, EAN, etc.)"
              />
            </div>
            <div className="w-36">
              <Button type="button" onClick={() => setScannerOpen(true)} className="w-full">
                Scan Barcode
              </Button>
            </div>
          </div>
          {/* Barcode scanner dialog */}
          <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={handleScannedBarcode} />
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="compareAtPrice">Compare At Price</Label>
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
            ref={stockRef}
           
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
                try {
                  const newProdDate = new Date(newProductionDate);
                  const expDate = new Date(expirationDate);

                  if (isNaN(newProdDate.getTime()) || isNaN(expDate.getTime())) {
                    setError("Invalid date format provided.");
                    return;
                  }

                  if (expDate < newProdDate) {
                    // Automatically set expiration date to production date if it's invalid
                    setExpirationDate(newProductionDate);
                    setError(null); // Clear any error since we're auto-correcting
                  }
                } catch (dateError) {
                  console.error("Date validation error in production date change:", {
                    message: dateError instanceof Error ? dateError.message : 'Unknown date error',
                    newProductionDate,
                    expirationDate
                  });
                  setError("Invalid date format provided.");
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
                try {
                  const prodDate = new Date(productionDate);
                  const expDate = new Date(newExpirationDate);

                  if (isNaN(prodDate.getTime()) || isNaN(expDate.getTime())) {
                    setError("Invalid date format provided.");
                    return;
                  }

                  if (expDate < prodDate) {
                    setError("Expiration date cannot be before production date.");
                    return;
                  } else {
                    // Clear the error if dates are valid (but only if it's related to date validation)
                    if (error && error.includes("cannot be before")) {
                      setError(null);
                    }
                  }
                } catch (dateError) {
                  console.error("Date validation error in expiration date change:", {
                    message: dateError instanceof Error ? dateError.message : 'Unknown date error',
                    productionDate,
                    newExpirationDate
                  });
                  setError("Invalid date format provided.");
                  return;
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