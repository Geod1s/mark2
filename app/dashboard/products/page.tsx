import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ProductsList } from "@/components/dashboard/products-list"
import { InventoryDashboard } from "@/components/dashboard/inventory-dashboard"
import { InventoryTrigger } from "@/components/dashboard/inventory-trigger"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { calculateInventoryMetrics } from "@/lib/inventory-utils"
import { getVendorInventoryThresholds } from "@/lib/inventory-actions"

export default async function ProductsPage() {
  // IMPORTANT: Add 'await' here
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/products")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  // Get vendor-specific inventory thresholds
  const { lowStockThreshold, overstockThreshold } = await getVendorInventoryThresholds(vendor.id)

  // Calculate inventory metrics
  const inventoryMetrics = calculateInventoryMetrics(
    products || [],
    lowStockThreshold,
    overstockThreshold
  )

  return (
    <DashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Inventory Dashboard */}
        <InventoryDashboard
          totalProducts={inventoryMetrics.totalProducts}
          outOfStockCount={inventoryMetrics.outOfStockCount}
          lowStockCount={inventoryMetrics.lowStockCount}
          overstockCount={inventoryMetrics.overstockCount}
          lowStockThreshold={lowStockThreshold}
          overstockThreshold={overstockThreshold}
        />

          {/* Inventory Triggers */}
          {/* Pass vendorId so the dashboard InventoryTrigger loads vendor thresholds */}
          <InventoryTrigger vendorId={vendor.id} />

        <ProductsList
          products={products || []}
          vendorId={vendor.id}
          lowStockThreshold={lowStockThreshold}
          overstockThreshold={overstockThreshold}
        />
      </div>
    </DashboardLayout>
  )
}