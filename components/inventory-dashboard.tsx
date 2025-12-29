import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Package, TrendingDown, TrendingUp, PackagePlus, MapPin, ShoppingCart, Store, Truck } from "lucide-react"

interface InventoryDashboardProps {
  totalProducts: number
  outOfStockCount: number
  lowStockCount: number
  overstockCount: number
  lowStockThreshold?: number
  overstockThreshold?: number
  activeLocations?: number
  pickupLocations?: number
  shippingOrigins?: number
}

export function InventoryDashboard({
  totalProducts,
  outOfStockCount,
  lowStockCount,
  overstockCount,
  lowStockThreshold = 5,
  overstockThreshold = 100,
  activeLocations = 0,
  pickupLocations = 0,
  shippingOrigins = 0
}: InventoryDashboardProps) {
  // Calculate products with adequate stock (not low stock, not out of stock, not overstock)
  const adequateStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount - overstockCount)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">All inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts - outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Products with stock available</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Below {lowStockThreshold} units</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overstock</CardTitle>
            <PackagePlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overstockCount}</div>
            <p className="text-xs text-muted-foreground">Above {overstockThreshold} units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adequate Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adequateStockCount}</div>
            <p className="text-xs text-muted-foreground">Optimally stocked items</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
            <p className="text-xs text-muted-foreground">Warehouses & stores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BOPIS Locations</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickupLocations}</div>
            <p className="text-xs text-muted-foreground">Available for pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping Origins</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippingOrigins}</div>
            <p className="text-xs text-muted-foreground">Available for shipping</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}