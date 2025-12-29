export type UserRole = "customer" | "vendor" | "admin"

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string
  store_name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  inventory_count: number
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  vendor?: Vendor
  category?: Category
  stock_quantity?: number
  sku?: string
  production_date?: string
  expiration_date?: string
}

export interface Order {
  id: string
  user_id: string | null
  vendor_id: string | null
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  platform_fee: number
  stripe_payment_intent_id: string | null
  shipping_address: ShippingAddress | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
  vendor?: Vendor
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

export interface Review {
  id: string
  product_id: string
  user_id: string | null
  rating: number
  comment: string | null
  created_at: string
  profile?: Profile
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface InventoryLocation {
  id: string
  vendor_id: string
  name: string
  type: 'warehouse' | 'store' | 'distribution_center' | 'custom'
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_active: boolean
  is_pickup_location: boolean
  is_shipping_origin: boolean
  created_at: string
  updated_at: string
}

export interface InventoryLocationProduct {
  id: string
  location_id: string
  product_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  product_id: string
  from_location_id?: string
  to_location_id?: string
  quantity: number
  movement_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment'
  reason: string
  reference_id?: string
  created_at: string
  created_by: string
}

export interface InventorySyncConfig {
  id: string
  vendor_id: string
  channel_type: 'ecommerce' | 'marketplace' | 'pos' | 'custom'
  channel_id: string
  sync_enabled: boolean
  sync_frequency: 'real_time' | 'hourly' | 'daily' | 'manual'
  last_sync_at?: string
  created_at: string
  updated_at: string
}