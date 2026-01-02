"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRefresh } from "@/hooks/use-refresh"
import type { Vendor, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  DollarSign,
  User,
  Check,
  X,
  Package,
  Printer,
  Scan
} from "lucide-react"
import { toast } from "sonner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Grid3X3, List } from "lucide-react"
import { BarcodeScanner } from "@/components/barcode-scanner"

interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
  stock_quantity?: number
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
}

interface ProductWithStock extends Product {
  stock_quantity?: number
  sku?: string
}

interface POSInterfaceProps {
  vendor: Vendor
  products: Product[]
}

async function createPOSOrder(orderData: {
  vendor_id: string
  total_amount: number
  items: any[]
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address: string
  payment_method: 'cash' | 'card'
  status: string
  is_pos_order: boolean
}) {
  try {
    const response = await fetch('/api/pos/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create order')
    }

    return result
  } catch (error) {
    console.error('POS order creation error:', error)
    throw error
  }
}

export function POSInterface({ vendor, products }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [originalProducts] = useState<Product[]>(products)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("products")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: ""
  })
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const { refresh } = useRefresh()

  // Calculate available stock based on original stock minus cart quantities
  const productsWithAvailableStock = originalProducts.map(originalProduct => {
    const cartItem = cart.find(item => item.product_id === originalProduct.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const originalProductWithStock = originalProduct as ProductWithStock;
    const originalStock = originalProductWithStock.stock_quantity || 0;
    const availableStock = Math.max(0, originalStock - cartQuantity);

    return {
      ...originalProduct,
      stock_quantity: availableStock
    };
  });

  // Filter products based on search (name, description, or barcode)
  const filteredProducts = productsWithAvailableStock.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product as ProductWithStock).barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category?.name || "Uncategorized"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // Internal print receipt function
  const internalPrintReceipt = (receiptData: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error("Failed to open print window. Please check your popup blocker.")
      return
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${vendor.store_name}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 15px;
            max-width: 300px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .order-id {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
          }
          .customer-info {
            margin: 10px 0;
            font-size: 12px;
          }
          .items {
            margin: 15px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding-bottom: 5px;
            border-bottom: 1px dotted #ddd;
          }
          .item-name {
            flex: 3;
            font-size: 12px;
          }
          .item-qty {
            flex: 1;
            text-align: center;
            font-size: 12px;
          }
          .item-price {
            flex: 2;
            text-align: right;
            font-size: 12px;
          }
          .total {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .grand-total {
            font-weight: bold;
            font-size: 16px;
          }
          .payment-method {
            margin-top: 15px;
            font-size: 12px;
            text-align: center;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .thank-you {
            text-align: center;
            margin-top: 20px;
            font-style: italic;
            font-size: 12px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body {
              font-size: 12px;
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${vendor.store_name}</div>
          <div class="receipt-info">${receiptData.date}</div>
          <div class="order-id">Receipt #${receiptData.orderId.slice(-8).toUpperCase()}</div>
        </div>

        <div class="customer-info">
          ${receiptData.customerInfo.name ? `<div><strong>Customer:</strong> ${receiptData.customerInfo.name}</div>` : ''}
          ${receiptData.customerInfo.phone ? `<div><strong>Phone:</strong> ${receiptData.customerInfo.phone}</div>` : ''}
          ${receiptData.customerInfo.email ? `<div><strong>Email:</strong> ${receiptData.customerInfo.email}</div>` : ''}
        </div>

        <div class="items">
          ${receiptData.items.map((item: any) => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity} x $${item.price.toFixed(2)}</div>
              <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="total-row">
            <div>Subtotal:</div>
            <div>$${receiptData.subtotal.toFixed(2)}</div>
          </div>
          <div class="total-row grand-total">
            <div>TOTAL:</div>
            <div>$${receiptData.total.toFixed(2)}</div>
          </div>
          <div class="payment-method">
            <div><strong>Payment Method:</strong> ${receiptData.paymentMethod === 'cash' ? 'CASH' : 'CARD'}</div>
          </div>
        </div>

        <div class="thank-you">
          Thank you for your purchase!
        </div>

        <div class="footer">
          <div>${vendor.store_name}</div>
          <div>Thank you for your business!</div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Receipt
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>

        <script>
          // Auto-print after 500ms
          setTimeout(() => {
            window.print();
            // Keep window open after printing
            setTimeout(() => {
              window.focus();
            }, 500);
          }, 500);
        </script>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  }

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    // Find product by barcode
    const product = originalProducts.find(p =>
      (p as ProductWithStock).barcode && (p as ProductWithStock).barcode === barcode
    );

    if (product) {
      addToCart(product);
      toast.success(`Added ${product.name} to cart`);
    } else {
      toast.error(`Product with barcode ${barcode} not found`);
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id)

      // Get the original stock for this product
      const originalProduct = originalProducts.find(p => p.id === product.id);
      const originalStock = (originalProduct as ProductWithStock)?.stock_quantity || 0;

      // Calculate available stock based on all items in cart for this product
      const otherCartItems = prevCart.filter(i => i.product_id === product.id);
      const otherQuantity = otherCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
      const availableStock = originalStock - otherQuantity;

      if (existingItem) {
        // Check stock for adding one more
        if (availableStock < 1) {
          toast.error(`Only ${originalStock - otherQuantity + existingItem.quantity} items available`)
          return prevCart
        }

        // Increase quantity by 1
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Check stock for adding new item
        if (availableStock < 1) {
          toast.error("Out of stock")
          return prevCart
        }

        // Add new item with quantity 1
        return [
          ...prevCart,
          {
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images?.[0],
            stock_quantity: originalStock
          }
        ]
      }
    })
  }

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === itemId)
      if (!item) return prevCart

      // Get the original stock for this product
      const originalProduct = originalProducts.find(p => p.id === item.product_id);
      const originalStock = (originalProduct as ProductWithStock)?.stock_quantity || 0;

      // Calculate available stock based on all items in cart except this one
      const otherCartItems = prevCart.filter(i => i.id !== itemId && i.product_id === item.product_id);
      const otherQuantity = otherCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
      const availableStock = originalStock - otherQuantity;

      // Check stock
      if (newQuantity > availableStock) {
        toast.error(`Only ${availableStock} items available`)
        return prevCart
      }

      if (newQuantity < 1) {
        return prevCart.filter(i => i.id !== itemId)
      }

      return prevCart.map(i =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      )
    })
  }

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      return prevCart.filter(item => item.id !== itemId)
    })
  }

  // Clear cart
  const clearCart = () => {
    setCart([]);
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal

  // Handle print receipt button click
  const handlePrintReceiptClick = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    const receiptData = {
      orderId: `TEMP-${Date.now()}`,
      date: new Date().toLocaleString(),
      items: cart,
      subtotal,
      total,
      paymentMethod,
      customerInfo,
      vendor
    }

    internalPrintReceipt(receiptData)
  }

  // Handle payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (total <= 0) {
      toast.error("Invalid total amount")
      return
    }

    setIsProcessing(true)

    try {
      const supabase = createClient()

      // Create cash order items
      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name,
        vendor_id: vendor.id,
        vendor_name: vendor.store_name
      }))

      // Create POS order using server action
      const result = await createPOSOrder({
        vendor_id: vendor.id,
        total_amount: total,
        items: orderItems,
        customer_name: customerInfo.name || "Walk-in Customer",
        customer_email: customerInfo.email || "",
        customer_phone: customerInfo.phone || "",
        delivery_address: "In-store pickup",
        payment_method: paymentMethod,
        status: paymentMethod === 'cash' ? 'paid' : 'pending',
        is_pos_order: true
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order')
      }

      // Update product stock for each item
      for (const item of cart) {
        // First, get current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        if (fetchError) {
          console.error(`Error fetching product ${item.product_id}:`, fetchError)
          continue
        }

        // Calculate new stock
        const currentStock = product.stock_quantity || 0
        const newStock = Math.max(0, currentStock - item.quantity)

        // Update stock in database
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)

        if (updateError) {
          console.error(`Error updating stock for product ${item.product_id}:`, updateError)
        }
      }

      // Generate receipt
      const receiptData = {
        orderId: result.order.id,
        date: new Date().toLocaleString(),
        items: cart,
        subtotal,
        total,
        paymentMethod,
        customerInfo,
        vendor
      }

      // Show success with option to print receipt
      toast.success("Sale completed successfully!", {
        action: {
          label: "Print Receipt",
          onClick: () => internalPrintReceipt(receiptData)
        }
      })

      // Clear cart and reset
      clearCart()
      setCustomerInfo({ name: "", phone: "", email: "" })

      // Refresh the page to update product stock and clear any cached data
      setTimeout(() => {
        refresh()
      }, 1000)
      
    } catch (error) {
      console.error("Payment error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Quick add buttons for common quantities
  const quickAdd = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id)

      // Get the original stock for this product
      const originalProduct = originalProducts.find(p => p.id === product.id);
      const originalStock = (originalProduct as ProductWithStock)?.stock_quantity || 0;

      // Calculate available stock based on all items in cart for this product
      const otherCartItems = prevCart.filter(i => i.product_id === product.id);
      const otherQuantity = otherCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
      const availableStock = originalStock - otherQuantity;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity > availableStock) {
          toast.error(`Only ${availableStock} items available`)
          return prevCart
        }

        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        if (quantity > availableStock) {
          toast.error(`Only ${availableStock} items available`)
          return prevCart
        }

        return [
          ...prevCart,
          {
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images?.[0],
            stock_quantity: originalStock
          }
        ]
      }
    })
  }

  return (
     <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Products */}
      <div className="lg:col-span-2 flex flex-col">
        {/* Search and View Toggle */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowBarcodeScanner(true)}
              className="shrink-0"
            >
              <Scan className="h-4 w-4" />
            </Button>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
              defaultValue="grid"
              className="shrink-0"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Product Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="products">All Products</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addToCart(product)}
                      onQuickAdd={(qty) => quickAdd(product, qty)}
                      cart={cart}
                      originalProducts={originalProducts}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      onAdd={() => addToCart(product)}
                      onQuickAdd={(qty) => quickAdd(product, qty)}
                      cart={cart}
                      originalProducts={originalProducts}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="categories" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">{category}</h3>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={() => addToCart(product)}
                          onQuickAdd={(qty) => quickAdd(product, qty)}
                          cart={cart}
                          originalProducts={originalProducts}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryProducts.map((product) => (
                        <ProductListItem
                          key={product.id}
                          product={product}
                          onAdd={() => addToCart(product)}
                          onQuickAdd={(qty) => quickAdd(product, qty)}
                          cart={cart}
                          originalProducts={originalProducts}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Cart & Checkout */}
      <div className="flex flex-col">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Sale
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReceiptClick}
                  disabled={cart.length === 0}
                  className="flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col h-[calc(100%-80px)]">
            {/* Cart Items */}
            <ScrollArea className="flex-1 mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add products to begin</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Totals */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information (Optional)
              </h4>
              
              <Input
                placeholder="Customer name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <Input
                placeholder="Phone number"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
              
              <Input
                placeholder="Email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            {/* Payment Method */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Payment Method</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </Button>
              </div>
            </div>

            {/* Complete Sale Button */}
            <Button
              size="lg"
              className="w-full mt-6"
              onClick={handlePayment}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Complete Sale - ${total.toFixed(2)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <BarcodeScanner
      open={showBarcodeScanner}
      onOpenChange={setShowBarcodeScanner}
      onScan={handleBarcodeScan}
    />
  </>
)
}

// Product Card Component
function ProductCard({
  product,
  onAdd,
  onQuickAdd,
  cart,
  originalProducts,
}: {
  product: Product
  onAdd: () => void
  onQuickAdd: (quantity: number) => void
  cart: CartItem[]
  originalProducts: Product[]
}) {
  const productWithStock = product as ProductWithStock
  const originalStock = (originalProducts.find(p => p.id === product.id) as ProductWithStock)?.stock_quantity || 0
  const cartItem = cart.find(item => item.product_id === product.id)
  const cartQuantity = cartItem ? cartItem.quantity : 0
  const availableStock = Math.max(0, originalStock - cartQuantity)
  const isOutOfStock = availableStock <= 0

  return (
    <div className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-50' : ''}`}>
      {product.images?.[0] ? (
        <div className="aspect-square overflow-hidden bg-secondary">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-secondary flex items-center justify-center">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {product.description || 'No description'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-semibold">${product.price.toFixed(2)}</p>
            {originalStock !== undefined && (
              <p className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                Stock: {availableStock}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {!isOutOfStock && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={onAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd(2)}
                disabled={availableStock < 2}
              >
                2x
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd(5)}
                disabled={availableStock < 5}
              >
                5x
              </Button>
            </>
          )}

          {isOutOfStock && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
            >
              Out of Stock
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Product List Item Component
function ProductListItem({
  product,
  onAdd,
  onQuickAdd,
  cart,
  originalProducts,
}: {
  product: Product
  onAdd: () => void
  onQuickAdd: (quantity: number) => void
  cart: CartItem[]
  originalProducts: Product[]
}) {
  const productWithStock = product as ProductWithStock
  const originalStock = (originalProducts.find(p => p.id === product.id) as ProductWithStock)?.stock_quantity || 0
  const cartItem = cart.find(item => item.product_id === product.id)
  const cartQuantity = cartItem ? cartItem.quantity : 0
  const availableStock = Math.max(0, originalStock - cartQuantity)
  const isOutOfStock = availableStock <= 0

  return (
    <div className={`border rounded-lg p-3 flex items-center gap-4 hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-50' : ''}`}>
      {product.images?.[0] ? (
        <div className="w-16 h-16 shrink-0 overflow-hidden rounded-md bg-secondary">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 shrink-0 bg-secondary rounded-md flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description || 'No description'}
            </p>
          </div>

          <div className="text-right ml-2">
            <p className="font-semibold">${product.price.toFixed(2)}</p>
            {originalStock !== undefined && (
              <p className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                Stock: {availableStock}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 ml-2">
        {!isOutOfStock && (
          <>
            <Button
              size="sm"
              onClick={onAdd}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onQuickAdd(2)}
              disabled={availableStock < 2}
            >
              2x
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onQuickAdd(5)}
              disabled={availableStock < 5}
            >
              5x
            </Button>
          </>
        )}

        {isOutOfStock && (
          <Button
            size="sm"
            variant="outline"
            disabled
          >
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  )
}