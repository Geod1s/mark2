import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Store, Search } from "lucide-react"
import { HeaderAuth } from "./header-auth"

export async function Header() {
  // Add 'await' here
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let vendor = null

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    profile = profileData

    if (profile?.role === "vendor") {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      vendor = vendorData
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <span className="text-xl font-semibold tracking-tight">Marketplace</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>
            {/* <Link href="/vendors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Vendors
            </Link> */}
            <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {user && (
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          )}

          <HeaderAuth user={user} profile={profile} vendor={vendor} />
        </div>
      </div>
    </header>
  )
}