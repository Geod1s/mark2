// import "server-only"
// import Stripe from "stripe"

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// // Platform fee percentage (e.g., 10%)
// export const PLATFORM_FEE_PERCENT = 10
import "server-only"
import Stripe from "stripe"

// Test mode API keys - Use these for demo
const STRIPE_SECRET_KEY = 'sk_test_51SYEZePW4vI0n5qj7r53MP1AtaE8QUHpbnUaglMbrJ1hCaHl0Al4aXAQtCRizDhY0fK4IjAkVn5hhpEdYcFqNxxT00kWBgvYU0'
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SYEZePW4vI0n5qjVTlcZ6knLKTsJXi1D3jbjpDrym5wqN69ZZvl3CB8VTPHrNuamncbYkpBl2uAJkP5jI3mnboB00szCZJy48'

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
})

// Platform fee percentage (e.g., 10%)
export const PLATFORM_FEE_PERCENT = 10

// Helper to check if we're in test mode (always true with these keys)
export const isTestEnvironment = true

// Test mode configuration
export const TEST_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  // Test card numbers that always work
  testCardNumbers: {
    success: '4242424242424242',
    requires_authentication: '4000002500003155',
    decline: '4000000000009995',
  },
  // Test bank account for vendor payouts
  testBankAccount: {
    routing_number: '110000000',
    account_number: '000123456789',
    account_holder_name: 'Test Vendor',
  }
}

// Helper to bypass vendor checks in test mode
export const checkVendorReadiness = async (vendorIds: string[]) => {
  console.log('🛠️ Demo mode: Skipping vendor setup checks')
  return { allReady: true, unreadyVendors: [] }
}

// Helper to check if vendor is ready for payments (always true in demo)
export const isVendorReady = (vendor: any) => {
  return true // Always ready in test mode
}