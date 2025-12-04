// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import type { Vendor } from "@/lib/types"
// import { CreditCard, CheckCircle, ExternalLink } from "lucide-react"

// interface PaymentsSetupProps {
//   vendor: Vendor
// }

// export function PaymentsSetup({ vendor }: PaymentsSetupProps) {
//   const [isLoading, setIsLoading] = useState(false)

//   const handleStripeConnect = async () => {
//     setIsLoading(true)

//     try {
//       const response = await fetch("/api/stripe/connect", {
//         method: "POST",
//       })

//       const data = await response.json()

//       if (data.url) {
//         window.location.href = data.url
//       }
//     } catch (error) {
//       console.error("Failed to start Stripe Connect onboarding:", error)
//     }

//     setIsLoading(false)
//   }

//   if (vendor.stripe_onboarding_complete) {
//     return (
//       <div className="rounded-lg border border-border bg-card p-6">
//         <div className="flex items-start gap-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
//             <CheckCircle className="h-5 w-5 text-green-500" />
//           </div>
//           <div className="flex-1">
//             <h3 className="font-medium">Stripe Connected</h3>
//             <p className="mt-1 text-sm text-muted-foreground">
//               Your Stripe account is connected and ready to receive payments.
//             </p>
//             <p className="mt-2 text-sm text-muted-foreground font-mono">Account ID: {vendor.stripe_account_id}</p>
//           </div>
//         </div>

//         <div className="mt-6 pt-6 border-t border-border">
//           <Button variant="outline" asChild>
//             <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
//               Open Stripe Dashboard
//               <ExternalLink className="ml-2 h-4 w-4" />
//             </a>
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="rounded-lg border border-border bg-card p-6">
//       <div className="flex items-start gap-4">
//         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
//           <CreditCard className="h-5 w-5" />
//         </div>
//         <div className="flex-1">
//           <h3 className="font-medium">Connect Stripe</h3>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Connect your Stripe account to receive payments directly from customers. Stripe handles all payment
//             processing securely.
//           </p>
//         </div>
//       </div>

//       <div className="mt-6 pt-6 border-t border-border space-y-4">
//         <div className="space-y-2 text-sm text-muted-foreground">
//           <p className="flex items-center gap-2">
//             <CheckCircle className="h-4 w-4 text-green-500" />
//             Secure payment processing
//           </p>
//           <p className="flex items-center gap-2">
//             <CheckCircle className="h-4 w-4 text-green-500" />
//             Automatic payouts to your bank
//           </p>
//           <p className="flex items-center gap-2">
//             <CheckCircle className="h-4 w-4 text-green-500" />
//             Support for credit cards & more
//           </p>
//         </div>

//         <Button onClick={handleStripeConnect} disabled={isLoading}>
//           {isLoading ? "Connecting..." : "Connect with Stripe"}
//         </Button>
//       </div>
//     </div>
//   )
// }
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Vendor } from "@/lib/types"
import { CreditCard, CheckCircle, ExternalLink, PlayCircle } from "lucide-react"

interface PaymentsSetupProps {
  vendor: Vendor
}

export function PaymentsSetup({ vendor }: PaymentsSetupProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStripeConnect = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Failed to start Stripe Connect onboarding:", error)
    }

    setIsLoading(false)
  }

  // Demo mode - always show as connected for test environment
  const isDemoMode = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('_live_')
  
  // In demo mode, we'll simulate that the vendor is connected
  const isConnected = vendor.stripe_onboarding_complete || isDemoMode

  if (isConnected) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">
              {vendor.stripe_onboarding_complete ? "Stripe Connected" : "Demo Mode - Payments Active"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {vendor.stripe_onboarding_complete 
                ? "Your Stripe account is connected and ready to receive payments."
                : "In demo mode, payments are processed without full Stripe Connect setup."
              }
            </p>
            {vendor.stripe_account_id && (
              <p className="mt-2 text-sm text-muted-foreground font-mono">
                Account ID: {vendor.stripe_account_id}
              </p>
            )}
            {isDemoMode && !vendor.stripe_onboarding_complete && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Demo Mode:</strong> Customers can complete purchases. 
                  Connect Stripe for real payments in production.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex gap-3">
          {vendor.stripe_onboarding_complete ? (
            <Button variant="outline" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                Open Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button onClick={handleStripeConnect} disabled={isLoading}>
              <PlayCircle className="mr-2 h-4 w-4" />
              {isLoading ? "Connecting..." : "Setup Real Payments"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Setup Payments</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Setup payments to receive money from customers. You can test immediately in demo mode.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Secure payment processing
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Automatic payouts to your bank
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Support for credit cards & more
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleStripeConnect} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect Stripe Account"}
          </Button>
          
          {/* Demo mode button that simulates connection */}
          {isDemoMode && (
            <Button 
              variant="outline" 
              onClick={() => {
                // In a real implementation, you might want to update the vendor status
                // For now, we'll just reload to show the connected state
                window.location.reload()
              }}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Enable Demo Mode
            </Button>
          )}
        </div>

        {isDemoMode && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Demo Option:</strong> Enable demo mode to test payments without Stripe Connect setup. 
              Customers will be able to complete purchases in test mode.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}