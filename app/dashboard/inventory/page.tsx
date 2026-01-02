import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { InventoryDashboard } from "@/components/inventory-dashboard"
import { InventoryLocationManager } from "@/components/inventory-location-manager"
import { InventoryTrigger } from "@/components/inventory-trigger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { Package, MapPin, ShoppingCart, Store, Truck } from "lucide-react"
import { InventoryLocation } from "@/lib/types"
import { SalesChannelIntegration } from "@/components/sales-channel-integration"
import { SingleSourceOfTruth } from "@/components/single-source-of-truth"
import { FulfillmentLocationMapper } from "@/components/fulfillment-location-mapper"
import { RealTimeSync } from "@/components/real-time-sync"
import { OrderRoutingRules } from "@/components/order-routing-rules"
import { BOPISManager } from "@/components/bopis-manager"
import { getInventoryLocations, getInventorySyncConfigs } from "@/lib/inventory-actions"

export default async function OmniInventoryDashboardPage() {
  // Add 'await' here
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!vendor) {
    redirect("/become-vendor")
  }

  // Fetch inventory metrics
  const { data: allProducts } = await supabase
    .from('products')
    .select('inventory_count')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)

  // Calculate inventory metrics
  const totalProducts = allProducts?.length || 0
  const outOfStockCount = allProducts?.filter((p: { inventory_count: number }) => (p.inventory_count || 0) <= 0).length || 0
  const lowStockCount = allProducts?.filter((p: { inventory_count: number }) => (p.inventory_count || 0) > 0 && (p.inventory_count || 0) <= 5).length || 0
  const overstockCount = allProducts?.filter((p: { inventory_count: number }) => (p.inventory_count || 0) >= 100).length || 0

  // Fetch inventory locations
  const locations = await getInventoryLocations(vendor.id)
  
  const activeLocations = locations?.filter((loc: InventoryLocation) => loc.is_active).length || 0
  const pickupLocations = locations?.filter((loc: InventoryLocation) => loc.is_pickup_location).length || 0
  const shippingOrigins = locations?.filter((loc: InventoryLocation) => loc.is_shipping_origin).length || 0

  // Fetch sync configurations
  const syncConfigs = await getInventorySyncConfigs(vendor.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Omnichannel Inventory</h1>
          <p className="text-muted-foreground">
            Manage inventory across all sales channels and locations
          </p>
        </div>
      </div>

      {/* Main Inventory Metrics */}
      <InventoryDashboard
        totalProducts={totalProducts}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        overstockCount={overstockCount}
        activeLocations={activeLocations}
        pickupLocations={pickupLocations}
        shippingOrigins={shippingOrigins}
      />

      {/* Single Source of Truth */}
      <SingleSourceOfTruth 
        vendorId={vendor.id} 
        inventoryData={[]} 
      />

      {/* Location Management */}
      <InventoryLocationManager
        vendorId={vendor.id}
        locations={locations || []}
      />

      {/* Fulfillment Location Mapper */}
      <FulfillmentLocationMapper 
        locations={locations || []} 
      />

      {/* Sales Channel Integration */}
      <SalesChannelIntegration
        vendorId={vendor.id}
        syncConfigs={syncConfigs || []}
      />

      {/* Real-Time Sync */}
      <RealTimeSync
        syncEnabled={true}
      />

      {/* Order Routing Rules */}
      <OrderRoutingRules
        locations={locations || []}
      />

      {/* BOPIS Manager */}
      <BOPISManager
        locations={locations || []}
        bopisEnabled={pickupLocations > 0}
      />

      {/* Inventory Triggers and Omnichannel Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryTrigger 
          initialLowStockThreshold={10}
          initialOverstockThreshold={100}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Omnichannel Features
            </CardTitle>
            <CardDescription>
              Configure features for multichannel selling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-green-600" />
                  <span className="font-medium">BOPIS (Buy Online, Pick Up In Store)</span>
                </div>
                <span className="text-sm">
                  {pickupLocations > 0 ? 'Enabled' : 'Not configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Multi-Origin Shipping</span>
                </div>
                <span className="text-sm">
                  {shippingOrigins > 0 ? 'Enabled' : 'Not configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Centralized Inventory</span>
                </div>
                <span className="text-sm">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Location-Based Fulfillment</span>
                </div>
                <span className="text-sm">
                  {activeLocations > 0 ? 'Active' : 'Not configured'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}