// app/become-vendor/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VendorRegistrationForm } from "@/components/vendor/registration-form"
import { redirect } from "next/navigation"
import { Store, CheckCircle, CreditCard, Package } from "lucide-react"

export default async function BecomeVendorPage() {
  const supabase = await createClient() // Add await here
  
  // Get user data with proper error handling
  const { data: userData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !userData?.user) {
    redirect("/auth/login?redirect=/become-vendor")
  }

  const user = userData.user;

  // Check if user is already a vendor
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // If there's an error or vendor already exists, redirect
  if (vendorError) {
    console.error("Error checking vendor status:", vendorError)
  }

  if (vendor) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* <Header /> */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Info */}
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Start selling on Marketplace</h1>

              <div className="mt-12 space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Create your POS system</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Set up your cloud POS with a unique name and URL
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Add your products</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      List your products with images, descriptions, and pricing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:pl-8">
              <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
                <h2 className="text-xl font-semibold">Create your POS</h2>
                <p className="mt-2 text-sm text-muted-foreground">Fill in the details below to get started</p>
                <VendorRegistrationForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  )
}