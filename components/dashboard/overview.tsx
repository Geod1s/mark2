import Link from "next/link"
import type { Vendor, Order } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, DollarSign, Plus, AlertCircle, CreditCard } from "lucide-react"

interface DashboardOverviewProps {
  vendor: Vendor
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    stripeOrdersCount?: number
    cashOrdersCount?: number
    stripeRevenue?: number
    cashRevenue?: number
  }
  recentOrders: Array<Order & {
    order_type?: 'stripe' | 'cash'
    customer_name?: string
    customer_email?: string
  }>
}

export function DashboardOverview({ vendor, stats, recentOrders }: DashboardOverviewProps) {
  const needsStripeSetup = !vendor.stripe_onboarding_complete
  
  // Calculate derived values with fallbacks
  const stripeOrdersCount = stats.stripeOrdersCount || 0
  const cashOrdersCount = stats.cashOrdersCount || 0
  const stripeRevenue = stats.stripeRevenue || 0
  const cashRevenue = stats.cashRevenue || 0

  return (
    <div className="space-y-8">
     
      {/* {needsStripeSetup && stats.totalOrders === 0 && (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium">Complete your payment setup</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Stripe account to receive card payments, or accept cash orders.
            </p>
          </div>
          <Link href="/dashboard/payments">
            <Button size="sm">Setup Payments</Button>
          </Link>
        </div>
      )} */}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-semibold">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{stats.totalOrders}</p>
              <div className="flex gap-2 mt-1">
                {stripeOrdersCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-200">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {stripeOrdersCount}
                  </Badge>
                )}
                {cashOrdersCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {cashOrdersCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold">${stats.totalRevenue.toFixed(2)}</p>
              <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                {stripeRevenue > 0 && (
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                    Card: ${stripeRevenue.toFixed(2)}
                  </span>
                )}
                {cashRevenue > 0 && (
                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    Cash: ${cashRevenue.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <div className="text-2xl font-semibold capitalize">
                {needsStripeSetup ? 'Cash Only' : 'Ready'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {needsStripeSetup ? 'Accepting cash orders' : 'Ready for all payments'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
        <Link href="/dashboard/orders">
          <Button variant="outline">View All Orders</Button>
        </Link>
        {/* {needsStripeSetup && (
          <Link href="/dashboard/payments">
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Setup Card Payments
            </Button>
          </Link>
        )} */}
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => {
              const isCashOrder = order.order_type === 'cash'
              
              return (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-secondary/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">Order #{order.id.slice(0, 8)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isCashOrder ? 'bg-amber-500/10 text-amber-500 border-amber-200' : 'bg-blue-500/10 text-blue-500 border-blue-200'}`}
                      >
                        {isCashOrder ? (
                          <>
                            <DollarSign className="h-3 w-3 mr-1" />
                            Cash
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3 w-3 mr-1" />
                            Card
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground mt-1">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      {isCashOrder && order.customer_name && (
                        <span className="hidden sm:inline">•</span>
                      )}
                      {isCashOrder && order.customer_name && (
                        <span className="truncate">{order.customer_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground">Start by adding products and sharing your store</p>
            </div>
          </div>
        )}
      </div>

      {/* Cash Orders Notice */}
      {/* {cashOrdersCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Cash Orders Active</h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                You have {cashOrdersCount} cash order{cashOrdersCount !== 1 ? 's' : ''}. 
                Customers have placed these orders without online payment. 
                You need to contact them directly for payment and delivery arrangements.
              </p>
              <Link href="/dashboard/orders">
                <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100">
                  Manage Cash Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}