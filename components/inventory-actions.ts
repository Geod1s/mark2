// Client-side re-exports of inventory management server actions
// This file allows client components to import server actions without violating Next.js rules

export {
  createInventoryLocation,
  getInventoryLocations,
  updateInventoryLocation,
  deleteInventoryLocation,
  getLocationInventory,
  updateLocationInventory,
  transferInventory,
  recordInventoryMovement,
  getProductInventoryMovements,
  getProductInventoryAcrossLocations,
  reserveInventory,
  releaseReservedInventory,
  fulfillReservedInventory,
  getTotalInventoryForVendor,
  upsertInventorySyncConfig,
  getInventorySyncConfigs
} from '@/lib/inventory-management'