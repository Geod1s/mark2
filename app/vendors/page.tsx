import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Store } from "lucide-react"

export default async function VendorsPage() {
  const supabase = createClient()
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Vendors</h1>
            <p className="mt-1 text-muted-foreground">Discover unique stores from independent sellers</p>
          </div>

          {vendors && vendors.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.slug}`}
                  className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-4">
                    {vendor.logo_url ? (
                      <img
                        src={vendor.logo_url || "/placeholder.svg"}
                        alt={vendor.store_name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary group-hover:bg-background transition-colors">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium truncate">{vendor.store_name}</h3>
                      <p className="text-sm text-muted-foreground">@{vendor.slug}</p>
                    </div>
                  </div>
                  {vendor.description && (
                    <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{vendor.description}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <Store className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No vendors yet</p>
              <Link href="/become-vendor" className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
                Be the first to open a store
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
