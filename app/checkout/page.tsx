import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function CheckoutPage() {
  // Add 'await' here
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      "*, product:products(*, vendor:vendors(id, store_name, slug, stripe_account_id, stripe_onboarding_complete))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (!cartItems || cartItems.length === 0) {
    redirect("/cart")
  }

  // Check if we're in demo/test mode
  const isDemoMode = process.env.NODE_ENV === 'development' || 
                    process.env.STRIPE_SECRET_KEY?.includes('_test_') ||
                    !process.env.STRIPE_SECRET_KEY

  // Check if all vendors have Stripe connected (only enforce in production)
  const vendorsWithoutStripe = isDemoMode 
    ? [] // In demo mode, ignore vendor Stripe requirements
    : cartItems.filter((item: any) => !item.product?.vendor?.stripe_onboarding_complete)

  // Show demo mode notice
  const hasDemoVendors = cartItems.some((item: any) => !item.product?.vendor?.stripe_onboarding_complete)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

          {/* Demo Mode Notice */}
          {isDemoMode && hasDemoVendors && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">i</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Demo Mode Active
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    You're in demo mode. Some vendors haven't completed payment setup, but you can still proceed with test payments.
                    Use test card <strong>4242 4242 4242 4242</strong> to complete your order.
                  </p>
                </div>
              </div>
            </div>
          )}

          {vendorsWithoutStripe.length > 0 && !isDemoMode ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">!</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Payment Setup Required</h3>
              <p className="text-muted-foreground mb-4">
                Some vendors in your cart haven&apos;t completed their payment setup yet. Please try again later or
                remove those items from your cart.
              </p>
              <div className="flex gap-4 justify-center">
                <Link 
                  href="/cart" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  Return to cart
                </Link>
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Try Anyway (Dev Mode)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <CheckoutForm cartItems={cartItems} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}