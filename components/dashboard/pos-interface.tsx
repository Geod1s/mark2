"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Vendor, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Package
} from "lucide-react"
import { toast } from "sonner"

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

// Extended Product type with optional POS-specific fields
interface ProductWithStock extends Product {
  stock_quantity?: number
  sku?: string
}

interface POSInterfaceProps {
  vendor: Vendor
  products: Product[]
}

// Server action for creating POS orders
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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("products")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: ""
  })
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Add product to cart
  const addToCart = (product: Product) => {
    const productWithStock = product as ProductWithStock
    const stockQuantity = productWithStock.stock_quantity
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id)
      
      if (existingItem) {
        // Check stock
        if (stockQuantity !== undefined && existingItem.quantity >= stockQuantity) {
          toast.error(`Only ${stockQuantity} items available`)
          return prevCart
        }
        
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Check stock
        if (stockQuantity !== undefined && stockQuantity < 1) {
          toast.error("Out of stock")
          return prevCart
        }
        
        return [
          ...prevCart,
          {
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images?.[0],
            stock_quantity: stockQuantity
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
      
      // Check stock
      if (item.stock_quantity !== undefined && newQuantity > item.stock_quantity) {
        toast.error(`Only ${item.stock_quantity} items available`)
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
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.1 // 10% tax for example
  const total = subtotal + tax

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
        continue // Skip this product but continue with others
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
      } else {
        console.log(`Stock updated for product ${item.product_id}: ${currentStock} -> ${newStock}`)
      }
    }

    // Generate receipt
    const receiptData = {
      orderId: result.order.id,
      date: new Date().toLocaleString(),
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      customerInfo
    }

    // Show success
    toast.success("Sale completed successfully!", {
      action: {
        label: "Print Receipt",
        onClick: () => printReceipt(receiptData)
      }
    })

    // Clear cart and reset
    clearCart()
    setCustomerInfo({ name: "", phone: "", email: "" })
    
  } catch (error) {
    console.error("Payment error:", error)
    toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.")
  } finally {
    setIsProcessing(false)
  }
}

  // Print receipt
  const printReceipt = (receiptData: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .store-name { font-size: 18px; font-weight: bold; }
          .order-id { font-size: 12px; color: #666; }
          .items { margin: 20px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .item-name { flex: 2; }
          .item-qty { flex: 1; text-align: center; }
          .item-price { flex: 1; text-align: right; }
          .total { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .thank-you { text-align: center; margin-top: 30px; font-style: italic; }
          @media print {
            body { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${vendor.store_name}</div>
          <div class="order-id">Order #${receiptData.orderId.slice(0, 8)}</div>
          <div>${receiptData.date}</div>
        </div>
        
        ${receiptData.customerInfo.name ? `<div>Customer: ${receiptData.customerInfo.name}</div>` : ''}
        ${receiptData.customerInfo.phone ? `<div>Phone: ${receiptData.customerInfo.phone}</div>` : ''}
        
        <div class="items">
          ${receiptData.items.map((item: any) => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="total-row">
            <div>Subtotal:</div>
            <div>$${receiptData.subtotal.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div>Tax:</div>
            <div>$${receiptData.tax.toFixed(2)}</div>
          </div>
          <div class="total-row" style="font-weight: bold;">
            <div>Total:</div>
            <div>$${receiptData.total.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div>Payment:</div>
            <div>${receiptData.paymentMethod === 'cash' ? 'Cash' : 'Card'}</div>
          </div>
        </div>
        
        <div class="thank-you">
          Thank you for your purchase!
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  }

  // Quick add buttons for common quantities
  const quickAdd = (product: Product, quantity: number) => {
    const productWithStock = product as ProductWithStock
    const stockQuantity = productWithStock.stock_quantity
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id)
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        if (stockQuantity !== undefined && newQuantity > stockQuantity) {
          toast.error(`Only ${stockQuantity} items available`)
          return prevCart
        }
        
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        if (stockQuantity !== undefined && quantity > stockQuantity) {
          toast.error(`Only ${stockQuantity} items available`)
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
            stock_quantity: stockQuantity
          }
        ]
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Products */}
      <div className="lg:col-span-2 flex flex-col">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => addToCart(product)}
                    onQuickAdd={(qty) => quickAdd(product, qty)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="categories" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categoryProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={() => addToCart(product)}
                        onQuickAdd={(qty) => quickAdd(product, qty)}
                      />
                    ))}
                  </div>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
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
  )
}

// Product Card Component
function ProductCard({ 
  product, 
  onAdd,
  onQuickAdd 
}: { 
  product: Product
  onAdd: () => void
  onQuickAdd: (quantity: number) => void
}) {
  const productWithStock = product as ProductWithStock
  const stockQuantity = productWithStock.stock_quantity
  const isOutOfStock = stockQuantity !== undefined && stockQuantity <= 0

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
            {stockQuantity !== undefined && (
              <p className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                Stock: {stockQuantity}
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
                disabled={stockQuantity !== undefined && stockQuantity < 2}
              >
                2x
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd(5)}
                disabled={stockQuantity !== undefined && stockQuantity < 5}
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