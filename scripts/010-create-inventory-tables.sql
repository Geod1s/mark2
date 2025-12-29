-- Inventory Tables Schema
-- Run this script to create inventory-related tables

-- ============================================
-- INVENTORY LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'store', 'distribution_center', 'custom')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  is_active BOOLEAN DEFAULT TRUE,
  is_pickup_location BOOLEAN DEFAULT FALSE,
  is_shipping_origin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY LOCATION PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_location_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES inventory_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER DEFAULT 0 CHECK (available_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, product_id)
);

-- ============================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'transfer', 'adjustment')),
  reason TEXT,
  reference_id TEXT, -- Order ID, transfer ID, etc.
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY SYNC CONFIGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_sync_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('ecommerce', 'marketplace', 'pos', 'custom')),
  channel_id TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('real_time', 'hourly', 'daily', 'manual')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, channel_type, channel_id)
);

-- ============================================
-- INVENTORY LOCATIONS TRIGGER
-- ============================================
CREATE TRIGGER update_inventory_locations_updated_at
  BEFORE UPDATE ON inventory_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INVENTORY LOCATION PRODUCTS TRIGGER
-- ============================================
CREATE TRIGGER update_inventory_location_products_updated_at
  BEFORE UPDATE ON inventory_location_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INVENTORY SYNC CONFIGS TRIGGER
-- ============================================
CREATE TRIGGER update_inventory_sync_configs_updated_at
  BEFORE UPDATE ON inventory_sync_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INVENTORY LOCATIONS INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_locations_vendor ON inventory_locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_active ON inventory_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_type ON inventory_locations(type);

-- ============================================
-- INVENTORY LOCATION PRODUCTS INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_location_products_location ON inventory_location_products(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_products_product ON inventory_location_products(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_products_available ON inventory_location_products(available_quantity);

-- ============================================
-- INVENTORY MOVEMENTS INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_location ON inventory_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_location ON inventory_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- ============================================
-- INVENTORY SYNC CONFIGS INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_sync_configs_vendor ON inventory_sync_configs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_configs_channel ON inventory_sync_configs(channel_type, channel_id);

-- ============================================
-- FUNCTION TO TRANSFER INVENTORY BETWEEN LOCATIONS
-- ============================================
CREATE OR REPLACE FUNCTION transfer_inventory(
  from_location_id UUID,
  to_location_id UUID,
  product_id UUID,
  transfer_quantity INTEGER,
  transfer_reason TEXT,
  user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Check if there's enough inventory at the source location
  IF (SELECT COALESCE(available_quantity, 0) FROM inventory_location_products
      WHERE location_id = from_location_id AND product_id = product_id) < transfer_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory at source location';
  END IF;

  -- Update source location (decrease inventory)
  UPDATE inventory_location_products
  SET
    quantity = quantity - transfer_quantity,
    available_quantity = available_quantity - transfer_quantity,
    updated_at = NOW()
  WHERE location_id = from_location_id AND product_id = product_id;

  -- If the source record doesn't exist, create it with negative values (shouldn't happen in normal cases)
  IF NOT FOUND THEN
    INSERT INTO inventory_location_products (location_id, product_id, quantity, reserved_quantity, available_quantity)
    VALUES (from_location_id, product_id, -transfer_quantity, 0, -transfer_quantity);
  END IF;

  -- Update destination location (increase inventory)
  INSERT INTO inventory_location_products (location_id, product_id, quantity, reserved_quantity, available_quantity)
  VALUES (to_location_id, product_id, transfer_quantity, 0, transfer_quantity)
  ON CONFLICT (location_id, product_id)
  DO UPDATE SET
    quantity = inventory_location_products.quantity + transfer_quantity,
    available_quantity = inventory_location_products.available_quantity + transfer_quantity,
    updated_at = NOW();

  -- Record the movement
  INSERT INTO inventory_movements (product_id, from_location_id, to_location_id, quantity, movement_type, reason, reference_id, created_by)
  VALUES (product_id, from_location_id, to_location_id, transfer_quantity, 'transfer', transfer_reason, 'transfer_' || gen_random_uuid(), user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO GET VENDOR INVENTORY TOTALS
-- ============================================
CREATE OR REPLACE FUNCTION get_vendor_inventory_totals(p_vendor_id UUID)
RETURNS TABLE (
  product_id UUID,
  total_quantity INTEGER,
  total_reserved INTEGER,
  total_available INTEGER,
  product_name TEXT,
  product_sku TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ilp.product_id,
    COALESCE(SUM(ilp.quantity), 0) as total_quantity,
    COALESCE(SUM(ilp.reserved_quantity), 0) as total_reserved,
    COALESCE(SUM(ilp.available_quantity), 0) as total_available,
    p.name as product_name,
    p.sku as product_sku
  FROM inventory_location_products ilp
  JOIN inventory_locations il ON il.id = ilp.location_id
  JOIN products p ON p.id = ilp.product_id
  WHERE il.vendor_id = p_vendor_id
  GROUP BY ilp.product_id, p.name, p.sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
