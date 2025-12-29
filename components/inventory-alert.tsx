import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryAlertProps {
  inventoryCount: number
  lowStockThreshold?: number
  overstockThreshold?: number
  className?: string
}

export function InventoryAlert({ 
  inventoryCount, 
  lowStockThreshold = 5, 
  overstockThreshold = 100,
  className 
}: InventoryAlertProps) {
  const isLowStock = inventoryCount <= lowStockThreshold && inventoryCount > 0
  const isOutOfStock = inventoryCount <= 0
  const isOverstock = inventoryCount >= overstockThreshold

  if (isOutOfStock) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive", className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Out of Stock</span>
      </div>
    )
  }

  if (isLowStock) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-yellow-700 dark:text-yellow-400", className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Low Stock ({inventoryCount})</span>
      </div>
    )
  }

  if (isOverstock) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md bg-blue-500/10 px-3 py-2 text-blue-700 dark:text-blue-400", className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Overstock ({inventoryCount})</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-400", className)}>
      <CheckCircle className="h-4 w-4" />
      <span className="text-sm font-medium">In Stock ({inventoryCount})</span>
    </div>
  )
}