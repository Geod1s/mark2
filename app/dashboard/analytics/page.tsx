import React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import AnalyticsCharts from "@/components/analytics/analytics-charts"
import { Package, ShoppingCart, DollarSign, AlertCircle, CreditCard } from "lucide-react"
import Link from "next/link"
import {  Plus} from "lucide-react"


type TopProduct = { id: string; name: string; sold: number }
type Product = { 
  id: string;
  user_id: string; 
  name: string; 
  price: number; 
  selling_price: number; 
  stock_quantity: number; 
  is_active: boolean;
  cost_price?: number;
  vendor_id: string;
}
type Order = { id: string; total_amount: number; created_at: string; user_id?: string; vendor_id: string; status: string }
type CashOrder = { id: string; total_amount: number; items: any[]; created_at: string; user_id?: string; vendor_id: string }
type OrderItem = { id: string; product_id: string; quantity: number; price: number; order_id: string }
type Vendor = { id: string; name: string; user_id: string }

export default async function AnalyticsPage() {
  
  
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/analytics")
  }

  const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle()
  if (!vendor) {
    redirect('/become-vendor')
  }

  // Fetch all necessary data WITH VENDOR FILTERS
  const [
    { data: ordersData },
    { data: cashOrdersData },
    { data: productsData },
    { data: orderItemsData },
    { data: usersData }
  ] = await Promise.all([
    // Only get orders for this vendor
    supabase.from('orders').select('id, total_amount, created_at, user_id, vendor_id, status').eq('vendor_id', vendor.id),

    // Only get cash orders for this vendor
    supabase.from('cash_orders').select('id, total_amount, items, created_at, user_id, vendor_id').eq('vendor_id', vendor.id),

    // Only get products for this vendor
    supabase.from('products').select('*').eq('is_active', true).eq('vendor_id', vendor.id),

    // First get order IDs for this vendor, then get order items for those orders
    (async () => {
      // Get all order IDs for this vendor that have paid status: confirmed, processing, shipped, delivered, paid
      const { data: vendorOrders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('vendor_id', vendor.id);

      if (!vendorOrders || vendorOrders.length === 0) {
        return { data: [] };
      }

      // Filter for paid orders only
      const paidOrderIds = vendorOrders
        .filter((order: { id: string; status: string }) =>
          order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'paid'
        )
        .map((order: { id: string }) => order.id);

      if (paidOrderIds.length === 0) {
        return { data: [] };
      }

      // Get order items for paid orders only
      return await supabase
        .from('order_items')
        .select('*')
        .in('order_id', paidOrderIds);
    })(),
    
    // Get users (this might be used for customer info)
    supabase.from('users').select('id, email, full_name')
  ])

  const orders: Order[] = ordersData ?? []
  const cashOrders: CashOrder[] = cashOrdersData ?? []
  const products: Product[] = productsData ?? []
  const orderItems: OrderItem[] = orderItemsData ?? []
  const users: any[] = usersData ?? []

  // Calculate total orders and revenue (already filtered by vendor)
  // Only count orders with paid status: confirmed, processing, shipped, delivered, paid
  const paidOrders = orders.filter(order =>
    order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'paid'
  )
  const totalOrders = orders.length + cashOrders.length
  const paidOrdersCount = paidOrders.length + cashOrders.length // cash orders are assumed to be paid
  const revenueFromOrders = paidOrders.reduce((sum: number, order: Order) => sum + (Number(order.total_amount) || 0), 0)
  const revenueFromCash = cashOrders.reduce((sum: number, order: CashOrder) => sum + (Number(order.total_amount) || 0), 0)
  const totalRevenue = revenueFromOrders + revenueFromCash

  // Calculate daily sales (Z Report)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dailyOrders = paidOrders.filter((order: Order) => order.created_at.startsWith(todayStr))
  const dailyCashOrders = cashOrders.filter((order: CashOrder) => order.created_at.startsWith(todayStr))

  const dailyRevenue = dailyOrders.reduce((sum: number, order: Order) => sum + (Number(order.total_amount) || 0), 0) +
                       dailyCashOrders.reduce((sum: number, order: CashOrder) => sum + (Number(order.total_amount) || 0), 0)

  // Calculate payment methods for Z Report
  let cashPayments = 0
  let cardPayments = 0
  
  // Add explicit type to the order parameter
  dailyOrders.forEach((order: Order) => {
    cardPayments += Number(order.total_amount) || 0
  })
  
  // Add explicit type to the order parameter
  dailyCashOrders.forEach((order: CashOrder) => {
    cashPayments += Number(order.total_amount) || 0
  })

  // Calculate taxes (assuming 8% tax rate for demo)
  const dailyTax = dailyRevenue * 0.08

  // Calculate top products (Best Sellers) - only for this vendor's products
  const productSales = new Map<string, { quantity: number, revenue: number }>()

  // From order_items (already filtered to paid orders)
  for (const item of orderItems) {
    const productId = item.product_id
    const quantity = Number(item.quantity) || 0
    const revenue = Number(item.price) * quantity || 0

    if (productSales.has(productId)) {
      const current = productSales.get(productId)!
      productSales.set(productId, {
        quantity: current.quantity + quantity,
        revenue: current.revenue + revenue
      })
    } else {
      productSales.set(productId, { quantity, revenue })
    }
  }

  // From cash_orders items (already filtered by vendor)
  for (const order of cashOrders) {
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')
    for (const item of items) {
      const productId = item.product_id || item.id
      const quantity = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      const revenue = price * quantity

      if (productSales.has(productId)) {
        const current = productSales.get(productId)!
        productSales.set(productId, {
          quantity: current.quantity + quantity,
          revenue: current.revenue + revenue
        })
      } else {
        productSales.set(productId, { quantity, revenue })
      }
    }
  }

  // Get top products - only from this vendor's products
  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(top => {
      const product = products.find((p: Product) => p.id === top.id)
      return {
        id: top.id,
        name: product?.name || 'Unknown Product',
        quantity: top.quantity,
        revenue: top.revenue
      }
    })

  // Calculate hourly sales for today (already filtered by vendor)
  const hourlySales = Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0 }))

  const todayOrders = [...paidOrders, ...cashOrders].filter((order: Order | CashOrder) =>
    new Date(order.created_at).toDateString() === today.toDateString()
  )

  // Add explicit type to the order parameter
  todayOrders.forEach((order: Order | CashOrder) => {
    const hour = new Date(order.created_at).getHours()
    const revenue = Number(order.total_amount) || 0
    hourlySales[hour].revenue += revenue
  })

  // Calculate gross margin - only for this vendor's products
  let totalCost = 0
  let totalSales = 0

  for (const item of orderItems) {
    const product = products.find((p: Product) => p.id === item.product_id)
    if (product) {
      const cost = Number(product.cost_price) || 0
      const quantity = Number(item.quantity) || 0
      totalCost += cost * quantity
    }
    totalSales += Number(item.price) * Number(item.quantity) || 0
  }

  for (const order of cashOrders) {
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')
    for (const item of items) {
      const product = products.find((p: Product) => p.id === (item.product_id || item.id))
      if (product) {
        const cost = Number(product.cost_price) || 0
        const quantity = Number(item.quantity) || 0
        totalCost += cost * quantity
      }
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 0
      totalSales += price * quantity
    }
  }

  const grossMargin = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0

  // Inventory reports - only this vendor's products
  const lowStockProducts = products
    .filter((product: Product) => product.stock_quantity < 10 && product.is_active)
    .sort((a: Product, b: Product) => a.stock_quantity - b.stock_quantity)
    .slice(0, 10)

  const inventoryValuation = products.reduce((sum: number, product: Product) => {
    const cost = Number(product.cost_price) || 0
    const quantity = Number(product.stock_quantity) || 0
    return sum + (cost * quantity)
  }, 0)

  // Prepare data for charts
  const hourlySalesData = hourlySales.map(item => ({
    hour: `${item.hour}:00`,
    revenue: item.revenue
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <DashboardLayout vendor={vendor}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your business insights</p>
        </div>

        {/* Summary Cards - Dashboard Style */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Total Revenue Card */}
        
          <Revenuefora 
            totalRevenue1={totalRevenue}
            cashRevenue={revenueFromCash}
            stripeRevenue={revenueFromOrders}
          />

          {/* Total Orders Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Orders</p>
                <p className="text-2xl font-semibold">{paidOrdersCount}</p>
                <div className="flex gap-2 mt-1">
                  {paidOrders.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-200">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {paidOrders.length}
                    </Badge>
                  )}
                  {cashOrders.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-200">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {cashOrders.length}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total orders: {totalOrders}
                </div>
              </div>
            </div>
          </div>

          {/* Active Products Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-semibold">{products.length}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Your products in inventory
                </div>
              </div>
            </div>
          </div>

          {/* Gross Margin Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <div className="text-2xl font-semibold">{grossMargin.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your profit margin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Sales Reports</h2>

          {/* Total Revenue Calculation Explanation */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Total Revenue Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Formula</p>
                  <p className="text-lg font-semibold">(Price per Unit × Quantity Sold)</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Items Sold</p>
                  <p className="text-2xl font-bold text-primary">{orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) + cashOrders.reduce((sum, order) => {
  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  return sum + items.reduce((itemSum: number, item: any) => itemSum + (Number(item.quantity) || 0), 0);
}, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Daily Sales (Z Report) */}
            <Card>
              <CardHeader>
                <CardTitle>Your Daily Sales (Z Report)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{today.toDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="font-medium">${dailyRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Sales</p>
                    <p className="font-medium">${cashPayments.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Card Sales</p>
                    <p className="font-medium">${cardPayments.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Collected</p>
                    <p className="font-medium">${dailyTax.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="font-medium">{dailyOrders.length + dailyCashOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Your Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.slice(0, 5).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales by Time/Hour and Gross Margin in one card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Sales by Hour (Today)</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts
                  hourlySalesData={hourlySalesData}
                  pieData={[
                    { name: 'Gross Profit', value: totalSales - totalCost },
                    { name: 'Cost of Goods', value: totalCost }
                  ]}
                  totalSales={totalSales}
                  totalCost={totalCost}
                  grossMargin={grossMargin}
                />
              </CardContent>
            </Card>

            {/* Top Products in another card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.slice(0, 5).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inventory Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Inventory Reports</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Stock-on-Hand */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stock-on-Hand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{products.reduce((sum: number, p: Product) => sum + (p.stock_quantity || 0), 0)}</div>
                <div className="text-sm text-muted-foreground">Total items in your stock</div>
              </CardContent>
            </Card>

            {/* Inventory Valuation */}
            <Card>
              <CardHeader>
                <CardTitle>Your Inventory Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${inventoryValuation.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Cost value of your inventory</div>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Your Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{lowStockProducts.length}</div>
                <div className="text-sm text-muted-foreground">Your items below threshold</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product: Product, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Low Stock</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No low stock items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}




interface RevenueStatsProps {
  totalRevenue1: number
  cashRevenue?: number
  stripeRevenue?: number
}

function Revenuefora({ totalRevenue1, cashRevenue = 0, stripeRevenue = 0 }: RevenueStatsProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-semibold">${totalRevenue1.toFixed(2)}</p>
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
  )
}