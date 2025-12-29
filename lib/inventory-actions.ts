// Client-side re-exports of server actions
// This file allows client components to import server actions without violating Next.js rules

export {
  getInventoryAlerts,
  updateInventoryThresholds,
  getInventoryMetrics,
  getVendorInventoryThresholds,
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
} from './inventory-actions-server'