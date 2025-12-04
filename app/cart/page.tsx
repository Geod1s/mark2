import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartItems } from "@/components/cart/cart-items"
import { redirect } from "next/navigation"

export default async function CartPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/cart")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("*, product:products(*, vendor:vendors(id, store_name, slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight">Shopping Cart</h1>
          <CartItems initialItems={cartItems || []} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
