-- Row Level Security (RLS) Policies
-- Run this after creating the schema

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can view all profiles (for displaying vendor/user info)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- VENDORS POLICIES
-- ============================================
-- Anyone can view active vendors (public storefront)
CREATE POLICY "Active vendors are viewable by everyone"
  ON vendors FOR SELECT
  USING (is_active = true);

-- Vendors can update their own store
CREATE POLICY "Vendors can update own store"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can create a vendor profile
CREATE POLICY "Authenticated users can create vendor"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Categories are public
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Only admins can manage categories (handled via service role)

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Anyone can view active products
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);

-- Vendors can view all their products (including inactive)
CREATE POLICY "Vendors can view all own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = products.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can insert products for their store
CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can update their own products
CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = products.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = products.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can view orders for their store
CREATE POLICY "Vendors can view store orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = orders.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Vendors can update order status
CREATE POLICY "Vendors can update order status"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = orders.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================
-- Users can view their own order items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Vendors can view order items for their orders
CREATE POLICY "Vendors can view store order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN vendors ON vendors.id = orders.vendor_id
      WHERE orders.id = order_items.order_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- System creates order items (via service role or trusted function)
CREATE POLICY "Authenticated users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- REVIEWS POLICIES
-- ============================================
-- Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CART ITEMS POLICIES
-- ============================================
-- Users can view their own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their cart
CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their cart
CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can remove from their cart
CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INVENTORY LOCATIONS POLICIES
-- ============================================
-- Vendors can view their own inventory locations
CREATE POLICY "Vendors can view own inventory locations"
  ON inventory_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_locations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can insert inventory locations for their store
CREATE POLICY "Vendors can insert own inventory locations"
  ON inventory_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_locations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can update their own inventory locations
CREATE POLICY "Vendors can update own inventory locations"
  ON inventory_locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_locations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can delete their own inventory locations
CREATE POLICY "Vendors can delete own inventory locations"
  ON inventory_locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_locations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- ============================================
-- INVENTORY LOCATION PRODUCTS POLICIES
-- ============================================
-- Vendors can view inventory at their locations
CREATE POLICY "Vendors can view inventory at own locations"
  ON inventory_location_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_location_products.location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
  );

-- Vendors can insert inventory for their locations
CREATE POLICY "Vendors can insert inventory for own locations"
  ON inventory_location_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_location_products.location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
  );

-- Vendors can update inventory at their locations
CREATE POLICY "Vendors can update inventory at own locations"
  ON inventory_location_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_location_products.location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- INVENTORY MOVEMENTS POLICIES
-- ============================================
-- Vendors can view movements for their products/locations
CREATE POLICY "Vendors can view inventory movements for own products/locations"
  ON inventory_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory_movements.product_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = products.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_movements.from_location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_movements.to_location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
  );

-- Vendors can insert movements for their products/locations
CREATE POLICY "Vendors can insert inventory movements for own products/locations"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory_movements.product_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = products.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_movements.from_location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM inventory_locations
      WHERE inventory_locations.id = inventory_movements.to_location_id
      AND EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = inventory_locations.vendor_id
        AND vendors.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- INVENTORY SYNC CONFIGS POLICIES
-- ============================================
-- Vendors can view their own sync configs
CREATE POLICY "Vendors can view own sync configs"
  ON inventory_sync_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_sync_configs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can insert sync configs for their store
CREATE POLICY "Vendors can insert own sync configs"
  ON inventory_sync_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_sync_configs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can update their own sync configs
CREATE POLICY "Vendors can update own sync configs"
  ON inventory_sync_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_sync_configs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can delete their own sync configs
CREATE POLICY "Vendors can delete own sync configs"
  ON inventory_sync_configs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = inventory_sync_configs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );
