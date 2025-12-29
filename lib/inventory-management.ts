'use server'

import { createClient } from './supabase/server'
import { InventoryLocation, InventoryLocationProduct, InventoryMovement, InventorySyncConfig } from './types'

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
export async function getTotalInventoryForVendor(vendorId: string) {
  const supabase = await createClient()

  // First get all locations for the vendor
  const { data: locations } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('vendor_id', vendorId)

  if (!locations || locations.length === 0) {
    return []
  }

  // Get inventory for all locations
  const { data, error } = await supabase
    .from('inventory_location_products')
    .select(`
      product_id,
      SUM(quantity) as total_quantity,
      SUM(reserved_quantity) as total_reserved,
      SUM(available_quantity) as total_available,
      products(name, sku)
    `)
    .in('location_id', locations.map(loc => loc.id))
    .group('product_id, products.name, products.sku')

  if (error) {
    throw new Error(`Failed to fetch total inventory for vendor: ${error.message}`)
  }

  return data
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