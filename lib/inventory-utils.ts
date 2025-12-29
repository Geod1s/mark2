// Helper functions for inventory management

export interface InventoryMetrics {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  overstockCount: number;
  adequateStockCount: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  stock_quantity?: number;
  inventory_count?: number;
}

/**
 * Calculate inventory metrics based on stock thresholds
 * @param products Array of products with stock information
 * @param lowStockThreshold Threshold below which stock is considered low (default: 5)
 * @param overstockThreshold Threshold above which stock is considered overstock (default: 100)
 * @returns Inventory metrics object
 */
export function calculateInventoryMetrics(
  products: ProductWithStock[],
  lowStockThreshold: number = 5,
  overstockThreshold: number = 100
): InventoryMetrics {
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => (p.stock_quantity ?? p.inventory_count ?? 0) <= 0).length;
  const lowStockCount = products.filter(p => {
    const stock = p.stock_quantity ?? p.inventory_count ?? 0;
    return stock > 0 && stock <= lowStockThreshold;
  }).length;
  const overstockCount = products.filter(p => (p.stock_quantity ?? p.inventory_count ?? 0) >= overstockThreshold).length;
  const adequateStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount - overstockCount);

  return {
    totalProducts,
    outOfStockCount,
    lowStockCount,
    overstockCount,
    adequateStockCount
  };
}

/**
 * Get stock status for a product based on thresholds
 * @param stock Current stock level
 * @param lowStockThreshold Threshold below which stock is considered low (default: 5)
 * @param overstockThreshold Threshold above which stock is considered overstock (default: 100)
 * @returns Stock status: 'out-of-stock', 'low-stock', 'adequate', or 'overstock'
 */
export function getStockStatus(
  stock: number,
  lowStockThreshold: number = 5,
  overstockThreshold: number = 100
): 'out-of-stock' | 'low-stock' | 'adequate' | 'overstock' {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= lowStockThreshold) return 'low-stock';
  if (stock >= overstockThreshold) return 'overstock';
  return 'adequate';
} 
