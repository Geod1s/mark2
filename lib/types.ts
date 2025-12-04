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
