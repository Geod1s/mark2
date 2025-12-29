import { AlertTriangle, Package, PackageCheck, PackageX, Bell, BellOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInventoryAlerts } from "@/lib/inventory-actions"

interface InventoryNotificationProps {
  lowStockProducts: any[]
  outOfStockProducts: any[]
  overstockProducts: any[]
}

export async function InventoryNotifications() {
  const { lowStock, outOfStock, overstock } = await getInventoryAlerts()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Inventory Alerts
        </CardTitle>
        <CardDescription>
          Products that require your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStock.length > 0 && (
            <div className="border border-yellow-500/30 rounded-lg bg-yellow-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h3 className="font-medium text-yellow-700 dark:text-yellow-400">Low Stock ({lowStock.length})</h3>
              </div>
              <ul className="space-y-2">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex justify-between items-center text-sm">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      {product.inventory_count} left
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outOfStock.length > 0 && (
            <div className="border border-destructive/30 rounded-lg bg-destructive/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <PackageX className="h-4 w-4 text-destructive" />
                <h3 className="font-medium text-destructive">Out of Stock ({outOfStock.length})</h3>
              </div>
              <ul className="space-y-2">
                {outOfStock.map((product) => (
                  <li key={product.id} className="flex justify-between items-center text-sm">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="border-destructive text-destructive">
                      0 left
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overstock.length > 0 && (
            <div className="border border-blue-500/30 rounded-lg bg-blue-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-blue-700 dark:text-blue-400">Overstock ({overstock.length})</h3>
              </div>
              <ul className="space-y-2">
                {overstock.map((product) => (
                  <li key={product.id} className="flex justify-between items-center text-sm">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                      {product.inventory_count} units
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowStock.length === 0 && outOfStock.length === 0 && overstock.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No inventory alerts at this time</p>
              <p className="text-sm text-muted-foreground">All products are within optimal stock levels</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}