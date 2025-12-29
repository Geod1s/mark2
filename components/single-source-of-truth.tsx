import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, MapPin, Store, Warehouse, AlertTriangle, CheckCircle } from "lucide-react"
import { InventoryLocationProduct } from '@/lib/types'

interface SingleSourceOfTruthProps {
  vendorId: string
  inventoryData: (InventoryLocationProduct & {
    location: { name: string, type: string }
    product: { name: string, sku?: string }
  })[]
}

export function SingleSourceOfTruth({ vendorId, inventoryData }: SingleSourceOfTruthProps) {
  // Group inventory by product
  const groupedInventory = inventoryData.reduce((acc, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = {
        product: item.product,
        locations: [],
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0
      }
    }
    
    acc[item.product_id].locations.push({
      location: item.location,
      quantity: item.quantity,
      reserved_quantity: item.reserved_quantity,
      available_quantity: item.available_quantity
    })
    
    acc[item.product_id].totalQuantity += item.quantity
    acc[item.product_id].totalReserved += item.reserved_quantity
    acc[item.product_id].totalAvailable += item.available_quantity
    
    return acc
  }, {} as Record<string, {
    product: { name: string, sku?: string }
    locations: {
      location: { name: string, type: string }
      quantity: number
      reserved_quantity: number
      available_quantity: number
    }[]
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
  }>)

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Warehouse className="h-4 w-4" />
      case 'store': return <Store className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Single Source of Truth
        </CardTitle>
        <CardDescription>
          Unified view of inventory across all locations and channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Inventory by Product</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedInventory).map(([productId, productData]) => {
                    const status = productData.totalAvailable <= 0 
                      ? 'out-of-stock' 
                      : productData.totalAvailable <= 5 
                        ? 'low-stock' 
                        : 'in-stock'
                    
                    return (
                      <TableRow key={productId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{productData.product.name}</div>
                            {productData.product.sku && (
                              <div className="text-sm text-muted-foreground">SKU: {productData.product.sku}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{productData.totalQuantity}</TableCell>
                        <TableCell className="text-right">{productData.totalAvailable}</TableCell>
                        <TableCell className="text-right">{productData.totalReserved}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={status === 'out-of-stock' ? 'destructive' : 
                                    status === 'low-stock' ? 'secondary' : 'default'}
                            className={status === 'low-stock' ? 'bg-yellow-500' : ''}
                          >
                            {status === 'out-of-stock' ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Out of Stock
                              </>
                            ) : status === 'low-stock' ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Low Stock
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                In Stock
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Inventory by Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedInventory).map(([productId, productData]) => (
                <div key={productId} className="border rounded-lg p-4">
                  <div className="font-medium mb-2">{productData.product.name}</div>
                  <div className="space-y-2">
                    {productData.locations.map((loc, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {getLocationIcon(loc.location.type)}
                          <span className="text-sm">{loc.location.name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{loc.available_quantity}</span>
                          <span className="text-muted-foreground"> available</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}