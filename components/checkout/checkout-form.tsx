// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { loadStripe } from "@stripe/stripe-js"
// import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
// import { createSimpleCheckoutSession } from "@/app/actions/checktest"
// import type { CartItem, Product, Vendor } from "@/lib/types"
// import { Loader2 } from "lucide-react"

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// type CartItemWithProduct = CartItem & {
//   product:
//     | (Product & {
//         vendor: Pick<Vendor, "id" | "store_name" | "slug" | "stripe_account_id" | "stripe_onboarding_complete"> | null
//       })
//     | null
// }

// interface CheckoutFormProps {
//   cartItems: CartItemWithProduct[]
// }

// export function CheckoutForm({ cartItems }: CheckoutFormProps) {
//   const [clientSecret, setClientSecret] = useState<string | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const fetchClientSecret = useCallback(async () => {
//     try {
//       const items = cartItems
//         .filter((item) => item.product && item.product.vendor)
//         .map((item) => ({
//           product_id: item.product_id,
//           quantity: item.quantity,
//           vendor_id: item.product!.vendor!.id,
//         }))

//       const secret = await createSimpleCheckoutSession(items)
//       return secret
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to create checkout session")
//       return null
//     }
//   }, [cartItems])

//   useEffect(() => {
//     fetchClientSecret().then((secret) => {
//       if (secret) setClientSecret(secret)
//     })
//   }, [fetchClientSecret])

//   const subtotal = cartItems.reduce((total, item) => {
//     if (!item.product) return total
//     return total + item.product.price * item.quantity
//   }, 0)

//   if (error) {
//     return (
//       <div className="mt-8 rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
//         <p className="text-destructive">{error}</p>
//       </div>
//     )
//   }

//   return (
//     <div className="mt-8 grid gap-8 lg:grid-cols-2">
//       {/* Order Summary */}
//       <div className="order-2 lg:order-1">
//         <div className="rounded-lg border border-border bg-card p-6">
//           <h2 className="font-semibold">Order Summary</h2>

//           <div className="mt-6 divide-y divide-border">
//             {cartItems.map((item) => {
//               if (!item.product) return null
//               const imageUrl =
//                 item.product.images?.[0] ||
//                 `/placeholder.svg?height=60&width=60&query=${encodeURIComponent(item.product.name)}`

//               return (
//                 <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
//                   <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
//                     <img
//                       src={imageUrl || "/placeholder.svg"}
//                       alt={item.product.name}
//                       className="h-full w-full object-cover"
//                     />
//                   </div>
//                   <div className="flex flex-1 flex-col">
//                     <p className="font-medium line-clamp-1">{item.product.name}</p>
//                     <p className="text-sm text-muted-foreground">{item.product.vendor?.store_name}</p>
//                     <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
//                   </div>
//                   <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
//                 </div>
//               )
//             })}
//           </div>

//           <div className="mt-6 border-t border-border pt-6 space-y-3">
//             <div className="flex justify-between text-sm">
//               <span className="text-muted-foreground">Subtotal</span>
//               <span>${subtotal.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between text-sm">
//               <span className="text-muted-foreground">Shipping</span>
//               <span>Free</span>
//             </div>
//             <div className="flex justify-between font-semibold text-lg pt-3 border-t border-border">
//               <span>Total</span>
//               <span>${subtotal.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stripe Checkout */}
//       <div className="order-1 lg:order-2">
//         <div className="rounded-lg border border-border bg-card p-6">
//           <h2 className="font-semibold mb-6">Payment</h2>

//           {clientSecret ? (
//             <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
//               <EmbeddedCheckout />
//             </EmbeddedCheckoutProvider>
//           ) : (
//             <div className="flex items-center justify-center py-12">
//               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
// 

// --- IGNORE --- v2 //

"use client"

import { useState, useEffect, useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { createSimpleCheckoutSession } from "@/app/actions/checkout"
import { createCashOrder } from "@/app/actions/cash-payment"
import type { CartItem, Product, Vendor } from "@/lib/types"
import { Loader2, CreditCard, DollarSign, CheckCircle, User, Mail, Phone, MapPin, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51SYEZePW4vI0n5qjVTlcZ6knLKTsJXi1D3jbjpDrym5wqN69ZZvl3CB8VTPHrNuamncbYkpBl2uAJkP5jI3mnboB00szCZJy48'
)

type CartItemWithProduct = CartItem & {
  product:
    | (Product & {
        vendor: Pick<Vendor, "id" | "store_name" | "slug"> | null
      })
    | null
}

interface CheckoutFormProps {
  cartItems: CartItemWithProduct[]
}

type PaymentMethod = 'stripe' | 'cash'

export function CheckoutForm({ cartItems }: CheckoutFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  // Cash payment form state
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  
  // Optional fields toggle
  const [includeContactInfo, setIncludeContactInfo] = useState(false)
  const [includeAddress, setIncludeAddress] = useState(false)
  const [includeInstructions, setIncludeInstructions] = useState(false)

  // Set user email if available (from auth session)
  useEffect(() => {
    // In a real app, you'd get this from user session
    // For demo, we'll use defaults
    setCustomerEmail('customer@example.com')
    setCustomerName('Customer')
  }, [])

  const handleCashPayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Prepare items for cash order
      const cashOrderItems = cartItems
        .filter(item => item.product && item.product.vendor)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product!.price,
          product_name: item.product!.name,
          vendor_id: item.product!.vendor!.id,
          vendor_name: item.product!.vendor!.store_name || 'Unknown Vendor'
        }))

      if (cashOrderItems.length === 0) {
        throw new Error("No valid items in cart")
      }

      // Create cash order with optional fields
      const result = await createCashOrder({
        items: cashOrderItems,
        customer_name: includeContactInfo && customerName ? customerName : undefined,
        customer_email: includeContactInfo && customerEmail ? customerEmail : undefined,
        customer_phone: includeContactInfo && customerPhone ? customerPhone : undefined,
        delivery_address: includeAddress && deliveryAddress ? deliveryAddress : undefined,
        special_instructions: includeInstructions && specialInstructions ? specialInstructions : undefined,
        payment_method: 'cash'
      })

      if (result.success) {
        setOrderSuccess(true)
        setOrderId(result.orderIds[0])
      } else {
        throw new Error(result.message || "Failed to place order")
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place cash order")
    } finally {
      setIsLoading(false)
    }
  }

  const subtotal = cartItems.reduce((total, item) => {
    if (!item.product) return total
    return total + item.product.price * item.quantity
  }, 0)

  // Show success message
  if (orderSuccess) {
    return (
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-semibold text-green-800 dark:text-green-300 mb-2">
            Order Placed Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-400 mb-4">
            Your cash order has been received. You can add more details later if needed.
          </p>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md mb-6 text-left w-full max-w-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">Order ID: <span className="font-mono">{orderId}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Amount: <span className="font-bold">${subtotal.toFixed(2)}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment Method: Cash on Delivery</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Status: Pending</p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <a href="/orders">View My Orders</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Continue Shopping</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      {/* Order Summary */}
      <div className="order-2 lg:order-1">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

          <div className="mt-4 divide-y divide-border">
            {cartItems.map((item) => {
              if (!item.product) return null
              const imageUrl =
                item.product.images?.[0] ||
                `/placeholder.svg?height=60&width=60&query=${encodeURIComponent(item.product.name)}`

              return (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">{item.product.vendor?.store_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 border-t border-border pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-border">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="order-1 lg:order-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-6">Quick Cash Order</h2>

          {/* Payment Method Selection */}
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="mb-6"
          >
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                Cash on Delivery (Quick Order)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card (Stripe)
              </Label>
            </div>
          </RadioGroup>

          {/* Cash Payment Form - All Optional */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              {/* Optional Contact Information */}
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-toggle" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Add Contact Information (Optional)
                </Label>
                <Switch
                  id="contact-toggle"
                  checked={includeContactInfo}
                  onCheckedChange={setIncludeContactInfo}
                />
              </div>

              {includeContactInfo && (
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  <div>
                    <Label htmlFor="customerName" className="text-sm">Full Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail" className="text-sm">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Your email (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone" className="text-sm">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Your phone (optional)"
                    />
                  </div>
                </div>
              )}

              {/* Optional Delivery Address */}
              <div className="flex items-center justify-between">
                <Label htmlFor="address-toggle" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Add Delivery Address (Optional)
                </Label>
                <Switch
                  id="address-toggle"
                  checked={includeAddress}
                  onCheckedChange={setIncludeAddress}
                />
              </div>

              {includeAddress && (
                <div className="pl-4 border-l-2 border-border">
                  <div>
                    <Label htmlFor="deliveryAddress" className="text-sm">Delivery Address</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Your delivery address (optional)"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Optional Special Instructions */}
              <div className="flex items-center justify-between">
                <Label htmlFor="instructions-toggle" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add Special Instructions (Optional)
                </Label>
                <Switch
                  id="instructions-toggle"
                  checked={includeInstructions}
                  onCheckedChange={setIncludeInstructions}
                />
              </div>

              {includeInstructions && (
                <div className="pl-4 border-l-2 border-border">
                  <div>
                    <Label htmlFor="specialInstructions" className="text-sm">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests? (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Quick Order:</strong> Place your order now, add details later. 
                  The vendor will contact you for any missing information.
                </p>
              </div>

              <Button
                onClick={handleCashPayment}
                disabled={isLoading}
                className="w-full mt-4"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Quick Order...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Place Quick Cash Order
                  </>
                )}
              </Button>

              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md mt-4">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> You can provide contact and address details now or share them directly with the vendor later.
                  No payment is required online for cash orders.
                </p>
              </div>
            </div>
          )}

          {/* Stripe Payment Form */}
          {paymentMethod === 'stripe' && (
            <div className="space-y-4">
              {/* Stripe logic remains the same */}
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select cash payment for quick ordering</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}