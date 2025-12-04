import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"

export default async function CheckoutSuccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the most recent order
  let recentOrder = null
  if (user) {
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    recentOrder = data
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
          </div>

          {recentOrder && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-medium">#{recentOrder.id.slice(0, 8)}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/orders">
              <Button className="w-full h-12 font-medium">
                <Package className="mr-2 h-4 w-4" />
                View My Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full bg-transparent">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
