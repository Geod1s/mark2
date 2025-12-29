'use server'

import { createClient } from './supabase/server'
import { InventoryLocation, InventoryLocationProduct, InventoryMovement, InventorySyncConfig } from './types'

export async function getInventoryAlerts() {
  const supabase = await createClient()

  // Get products with low stock (below threshold)
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('*, vendor:vendors(store_name)')
    .lte('inventory_count', 5)
    .gt('inventory_count', 0)
    .eq('is_active', true)

  // Get products that are out of stock
  const { data: outOfStockProducts } = await supabase
    .from('products')
    .select('*, vendor:vendors(store_name)')
    .lte('inventory_count', 0)
    .eq('is_active', true)

  // Get products that are overstocked
  const { data: overstockProducts } = await supabase
    .from('products')
    .select('*, vendor:vendors(store_name)')
    .gte('inventory_count', 100)
    .eq('is_active', true)

  return {
    lowStock: lowStockProducts || [],
    outOfStock: outOfStockProducts || [],
    overstock: overstockProducts || []
  }
}

export async function updateInventoryThresholds(lowStockThreshold: number, overstockThreshold: number) {
  // Validate the values
  if (lowStockThreshold < 1 || lowStockThreshold > 50) {
    throw new Error('Low stock threshold must be between 1 and 50')
  }

  if (overstockThreshold < 50 || overstockThreshold > 1000) {
    throw new Error('Overstock threshold must be between 50 and 1000')
  }

  // In a real application, you would update the database with these values
  // For now, we'll just return the validated values
  // await supabase.from('vendor_settings').upsert(
  //   {
  //     vendor_id: currentVendorId,
  //     low_stock_threshold: lowStockThreshold,
  //     overstock_threshold: overstockThreshold
  //   },
  //   { onConflict: 'vendor_id' }
  // )

  return { success: true, lowStockThreshold, overstockThreshold }
}

export async function getInventoryMetrics(vendorId: string) {
  const supabase = await createClient()

  // Get all products for inventory metrics
  const { data: allProducts } = await supabase
    .from('products')
    .select('inventory_count')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)

  // Calculate inventory metrics
  const totalProducts = allProducts?.length || 0
  const outOfStockCount = allProducts?.filter(p => (p.inventory_count || 0) <= 0).length || 0
  const lowStockCount = allProducts?.filter(p => (p.inventory_count || 0) > 0 && (p.inventory_count || 0) <= 5).length || 0
  const overstockCount = allProducts?.filter(p => (p.inventory_count || 0) >= 100).length || 0

  // Get location metrics
  const { data: locations } = await supabase
    .from('inventory_locations')
    .select('*')
    .eq('vendor_id', vendorId)

  const activeLocations = locations?.filter(loc => loc.is_active).length || 0
  const pickupLocations = locations?.filter(loc => loc.is_pickup_location).length || 0
  const shippingOrigins = locations?.filter(loc => loc.is_shipping_origin).length || 0

  return {
    totalProducts,
    outOfStockCount,
    lowStockCount,
    overstockCount,
    activeLocations,
    pickupLocations,
    shippingOrigins
  }
}

export async function getVendorInventoryThresholds(vendorId: string) {
  // In a real application, you would fetch from a vendor_settings table
  // For now, return default values
  // const { data: settings } = await supabase
  //   .from('vendor_settings')
  //   .select('low_stock_threshold, overstock_threshold')
  //   .eq('vendor_id', vendorId)
  //   .single()

  // if (settings) {
  //   return {
  //     lowStockThreshold: settings.low_stock_threshold || 5,
  //     overstockThreshold: settings.overstock_threshold || 100
  //   }
  // }

  // Return default values
  return {
    lowStockThreshold: 5,
    overstockThreshold: 100
  }
}

// Create a new inventory location
export async function createInventoryLocation(locationData: Omit<InventoryLocation, 'id' | 'created_at' | 'updated_at' | 'vendor_id'>, vendorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_locations')
    .insert({
      ...locationData,
      vendor_id: vendorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create inventory location: ${error.message}`)
  }

  return data as InventoryLocation
}

// Get all inventory locations for a vendor
export async function getInventoryLocations(vendorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_locations')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch inventory locations: ${error.message}`)
  }

  return data as InventoryLocation[]
}

// Update an inventory location
export async function updateInventoryLocation(locationId: string, updates: Partial<InventoryLocation>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_locations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', locationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update inventory location: ${error.message}`)
  }

  return data as InventoryLocation
}

// Delete an inventory location
export async function deleteInventoryLocation(locationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_locations')
    .delete()
    .eq('id', locationId)

  if (error) {
    throw new Error(`Failed to delete inventory location: ${error.message}`)
  }

  return { success: true }
}

// Get inventory for a specific location
export async function getLocationInventory(locationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_location_products')
    .select(`
      *,
      product:products(name, sku)
    `)
    .eq('location_id', locationId)

  if (error) {
    throw new Error(`Failed to fetch location inventory: ${error.message}`)
  }

  return data as InventoryLocationProduct[]
}

// Update inventory quantity at a specific location
export async function updateLocationInventory(locationId: string, productId: string, quantity: number) {
  const supabase = await createClient()

  // First, try to update existing record
  const { data: existing, error: updateError } = await supabase
    .from('inventory_location_products')
    .update({
      quantity,
      available_quantity: quantity,
      updated_at: new Date().toISOString()
    })
    .eq('location_id', locationId)
    .eq('product_id', productId)
    .select()
    .single()

  if (updateError && updateError.code === 'PGRST116') {
    // Record doesn't exist, insert a new one
    const { data: insertData, error: insertError } = await supabase
      .from('inventory_location_products')
      .insert({
        location_id: locationId,
        product_id: productId,
        quantity,
        reserved_quantity: 0,
        available_quantity: quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create location inventory: ${insertError.message}`)
    }

    return insertData as InventoryLocationProduct
  }

  if (updateError) {
    throw new Error(`Failed to update location inventory: ${updateError.message}`)
  }

  return existing as InventoryLocationProduct
}

// Transfer inventory between locations
export async function transferInventory(
  fromLocationId: string,
  toLocationId: string,
  productId: string,
  quantity: number,
  reason: string,
  userId: string
) {
  const supabase = await createClient()

  // Check if there's enough inventory at the source location
  const { data: sourceInventory, error: sourceError } = await supabase
    .from('inventory_location_products')
    .select('quantity')
    .eq('location_id', fromLocationId)
    .eq('product_id', productId)
    .single()

  if (sourceError || !sourceInventory) {
    throw new Error('Source location does not have this product in inventory')
  }

  if (sourceInventory.quantity < quantity) {
    throw new Error('Insufficient inventory at source location')
  }

  // Start a transaction to ensure consistency
  const { error: transferError } = await supabase.rpc('transfer_inventory', {
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    product_id: productId,
    transfer_quantity: quantity,
    transfer_reason: reason,
    user_id: userId
  })

  if (transferError) {
    throw new Error(`Failed to transfer inventory: ${transferError.message}`)
  }

  // Record the movement
  await recordInventoryMovement({
    product_id: productId,
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    quantity,
    movement_type: 'transfer',
    reason,
    reference_id: `transfer_${Date.now()}`,
    created_by: userId
  })

  return { success: true }
}

// Record an inventory movement
export async function recordInventoryMovement(movementData: Omit<InventoryMovement, 'id' | 'created_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      ...movementData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to record inventory movement: ${error.message}`)
  }

  return data as InventoryMovement
}

// Get inventory movements for a product
export async function getProductInventoryMovements(productId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      from_location:inventory_locations(name),
      to_location:inventory_locations(name)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch inventory movements: ${error.message}`)
  }

  return data as (InventoryMovement & {
    from_location?: { name: string }
    to_location?: { name: string }
  })[]
}

// Get inventory across all locations for a product
export async function getProductInventoryAcrossLocations(productId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_location_products')
    .select(`
      *,
      location:inventory_locations(name, type)
    `)
    .eq('product_id', productId)

  if (error) {
    throw new Error(`Failed to fetch product inventory across locations: ${error.message}`)
  }

  return data as (InventoryLocationProduct & {
    location: { name: string, type: string }
  })[]
}

// Reserve inventory for an order (for BOPIS or other fulfillment)
export async function reserveInventory(locationId: string, productId: string, quantity: number, orderId: string) {
  const supabase = await createClient()

  // Get current inventory
  const { data: inventory, error } = await supabase
    .from('inventory_location_products')
    .select('quantity, reserved_quantity, available_quantity')
    .eq('location_id', locationId)
    .eq('product_id', productId)
    .single()

  if (error || !inventory) {
    throw new Error('Product not found at this location')
  }

  if (inventory.available_quantity < quantity) {
    throw new Error('Insufficient available inventory to reserve')
  }

  // Update reserved quantity
  const newReserved = inventory.reserved_quantity + quantity
  const newAvailable = inventory.available_quantity - quantity

  const { error: updateError } = await supabase
    .from('inventory_location_products')
    .update({
      reserved_quantity: newReserved,
      available_quantity: newAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('location_id', locationId)
    .eq('product_id', productId)

  if (updateError) {
    throw new Error(`Failed to reserve inventory: ${updateError.message}`)
  }

  // Record the reservation as a movement
  await recordInventoryMovement({
    product_id: productId,
    from_location_id: locationId,
    quantity,
    movement_type: 'outbound',
    reason: `Order reservation for order ${orderId}`,
    reference_id: orderId,
    created_by: 'system'
  })

  return { success: true, newAvailable }
}

// Release reserved inventory (when order is cancelled)
export async function releaseReservedInventory(locationId: string, productId: string, quantity: number, orderId: string) {
  const supabase = await createClient()

  // Get current inventory
  const { data: inventory, error } = await supabase
    .from('inventory_location_products')
    .select('reserved_quantity, available_quantity')
    .eq('location_id', locationId)
    .eq('product_id', productId)
    .single()

  if (error || !inventory) {
    throw new Error('Product not found at this location')
  }

  if (inventory.reserved_quantity < quantity) {
    throw new Error('Not enough reserved inventory to release')
  }

  // Update reserved quantity
  const newReserved = inventory.reserved_quantity - quantity
  const newAvailable = inventory.available_quantity + quantity

  const { error: updateError } = await supabase
    .from('inventory_location_products')
    .update({
      reserved_quantity: newReserved,
      available_quantity: newAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('location_id', locationId)
    .eq('product_id', productId)

  if (updateError) {
    throw new Error(`Failed to release reserved inventory: ${updateError.message}`)
  }

  return { success: true, newAvailable }
}

// Fulfill reserved inventory (when order is shipped/picked up)
export async function fulfillReservedInventory(locationId: string, productId: string, quantity: number, orderId: string) {
  const supabase = await createClient()

  // Get current inventory
  const { data: inventory, error } = await supabase
    .from('inventory_location_products')
    .select('reserved_quantity, quantity')
    .eq('location_id', locationId)
    .eq('product_id', productId)
    .single()

  if (error || !inventory) {
    throw new Error('Product not found at this location')
  }

  if (inventory.reserved_quantity < quantity) {
    throw new Error('Not enough reserved inventory to fulfill')
  }

  // Update quantities (remove from total inventory)
  const newQuantity = inventory.quantity - quantity
  const newReserved = inventory.reserved_quantity - quantity

  const { error: updateError } = await supabase
    .from('inventory_location_products')
    .update({
      quantity: newQuantity,
      reserved_quantity: newReserved,
      available_quantity: newQuantity - newReserved,
      updated_at: new Date().toISOString()
    })
    .eq('location_id', locationId)
    .eq('product_id', productId)

  if (updateError) {
    throw new Error(`Failed to fulfill reserved inventory: ${updateError.message}`)
  }

  return { success: true }
}

// Get total inventory across all locations for a vendor
export async function getTotalInventoryForVendor(vendorId: string): Promise<Array<{
  product_id: string;
  total_quantity: number;
  total_reserved: number;
  total_available: number;
  products: {
    name: string;
    sku: string;
  };
}>> {
  const supabase = await createClient()

  // First get all locations for the vendor
  const { data: locations } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('vendor_id', vendorId)

  if (!locations || locations.length === 0) {
    return []
  }

  // Get inventory for all locations using the stored function
  const { data, error } = await supabase
    .rpc('get_vendor_inventory_totals', { p_vendor_id: vendorId })

  if (error) {
    throw new Error(`Failed to fetch total inventory for vendor: ${error.message}`)
  }

  // Format the data to match the expected return type
  const formattedData = data?.map((item: {
    product_id: string;
    total_quantity: number;
    total_reserved: number;
    total_available: number;
    product_name: string;
    product_sku: string;
  }) => ({
    product_id: item.product_id,
    total_quantity: item.total_quantity,
    total_reserved: item.total_reserved,
    total_available: item.total_available,
    products: {
      name: item.product_name,
      sku: item.product_sku
    }
  })) || [];

  return formattedData
}

// Create or update inventory sync configuration
export async function upsertInventorySyncConfig(config: Omit<InventorySyncConfig, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_sync_configs')
    .upsert({
      ...config,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'vendor_id, channel_type, channel_id' })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to upsert inventory sync config: ${error.message}`)
  }

  return data as InventorySyncConfig
}

// Get inventory sync configurations for a vendor
export async function getInventorySyncConfigs(vendorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_sync_configs')
    .select('*')
    .eq('vendor_id', vendorId)

  if (error) {
    throw new Error(`Failed to fetch inventory sync configs: ${error.message}`)
  }

  return data as InventorySyncConfig[]
}