import React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/layout"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import AnalyticsCharts from "@/components/analytics/analytics-charts"

type TopProduct = { id: string; name: string; sold: number }
type Product = { id: string; name: string; cost_price: number; selling_price: number; stock_quantity: number; is_active: boolean }
type Order = { id: string; total_amount: number; created_at: string; user_id?: string }
type CashOrder = { id: string; total_amount: number; items: any[]; created_at: string; user_id?: string }
type OrderItem = { id: string; product_id: string; quantity: number; price: number }
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

  // Fetch all necessary data
  const [
    { data: ordersData },
    { data: cashOrdersData },
    { data: productsData },
    { data: orderItemsData },
    { data: usersData }
  ] = await Promise.all([
    supabase.from('orders').select('id, total_amount, created_at, user_id'),
    supabase.from('cash_orders').select('id, total_amount, items, created_at, user_id'),
    supabase.from('products').select('*').eq('is_active', true),
    supabase.from('order_items').select('*'),
    supabase.from('users').select('id, email, full_name')
  ])

  const orders = ordersData ?? []
  const cashOrders = cashOrdersData ?? []
  const products = productsData ?? []
  const orderItems = orderItemsData ?? []
  const users = usersData ?? []

  // Calculate total orders and revenue
  const totalOrders = orders.length + cashOrders.length
  const revenueFromOrders = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
  const revenueFromCash = cashOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
  const totalRevenue = revenueFromOrders + revenueFromCash

  // Calculate daily sales (Z Report)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dailyOrders = orders.filter(order => order.created_at.startsWith(todayStr))
  const dailyCashOrders = cashOrders.filter(order => order.created_at.startsWith(todayStr))

  const dailyRevenue = dailyOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) +
                       dailyCashOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)

  // Calculate payment methods for Z Report
  let cashPayments = 0
  let cardPayments = 0
  dailyOrders.forEach(order => {
    cardPayments += Number(order.total_amount) || 0
  })
  dailyCashOrders.forEach(order => {
    cashPayments += Number(order.total_amount) || 0
  })

  // Calculate taxes (assuming 8% tax rate for demo)
  const dailyTax = dailyRevenue * 0.08

  // Calculate top products (Best Sellers)
  const productSales = new Map<string, { quantity: number, revenue: number }>()

  // From order_items
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

  // From cash_orders items
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

  // Get top products
  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(top => {
      const product = products.find(p => p.id === top.id)
      return {
        id: top.id,
        name: product?.name || 'Unknown Product',
        quantity: top.quantity,
        revenue: top.revenue
      }
    })

  // Calculate hourly sales for today
  const hourlySales = Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0 }))

  const todayOrders = [...orders, ...cashOrders].filter(order =>
    new Date(order.created_at).toDateString() === today.toDateString()
  )

  todayOrders.forEach(order => {
    const hour = new Date(order.created_at).getHours()
    const revenue = Number(order.total_amount) || 0
    hourlySales[hour].revenue += revenue
  })

  // Calculate gross margin
  let totalCost = 0
  let totalSales = 0

  for (const item of orderItems) {
    const product = products.find(p => p.id === item.product_id)
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
      const product = products.find(p => p.id === (item.product_id || item.id))
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

  // Inventory reports
  const lowStockProducts = products
    .filter(product => product.stock_quantity < 10 && product.is_active)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 10)

  const inventoryValuation = products.reduce((sum, product) => {
    const cost = Number(product.cost_price) || 0
    const quantity = Number(product.stock_quantity) || 0
    return sum + (cost * quantity)
  }, 0)

  // Employee reports - sales by associate
  const salesByAssociate = new Map<string, { name: string, revenue: number, orders: number }>()

  // Add online orders
  for (const order of orders) {
    if (order.user_id) {
      const user = users.find(u => u.id === order.user_id)
      const name = user?.full_name || user?.email || 'Unknown'

      if (salesByAssociate.has(order.user_id)) {
        const current = salesByAssociate.get(order.user_id)!
        salesByAssociate.set(order.user_id, {
          name,
          revenue: current.revenue + (Number(order.total_amount) || 0),
          orders: current.orders + 1
        })
      } else {
        salesByAssociate.set(order.user_id, {
          name,
          revenue: Number(order.total_amount) || 0,
          orders: 1
        })
      }
    }
  }

  // Add cash orders (assuming staff ID is stored in user_id)
  for (const order of cashOrders) {
    if (order.user_id) {
      const user = users.find(u => u.id === order.user_id)
      const name = user?.full_name || user?.email || 'Cash Sale'

      if (salesByAssociate.has(order.user_id)) {
        const current = salesByAssociate.get(order.user_id)!
        salesByAssociate.set(order.user_id, {
          name,
          revenue: current.revenue + (Number(order.total_amount) || 0),
          orders: current.orders + 1
        })
      } else {
        salesByAssociate.set(order.user_id, {
          name,
          revenue: Number(order.total_amount) || 0,
          orders: 1
        })
      }
    }
  }

  const salesByAssociateArray = Array.from(salesByAssociate.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Customer reports
  const customerPurchaseHistory = new Map<string, { name: string, orders: number, totalSpent: number }>()

  for (const order of orders) {
    if (order.user_id) {
      const user = users.find(u => u.id === order.user_id)
      const name = user?.full_name || user?.email || 'Unknown'

      if (customerPurchaseHistory.has(order.user_id)) {
        const current = customerPurchaseHistory.get(order.user_id)!
        customerPurchaseHistory.set(order.user_id, {
          name,
          orders: current.orders + 1,
          totalSpent: current.totalSpent + (Number(order.total_amount) || 0)
        })
      } else {
        customerPurchaseHistory.set(order.user_id, {
          name,
          orders: 1,
          totalSpent: Number(order.total_amount) || 0
        })
      }
    }
  }

  const topCustomers = Array.from(customerPurchaseHistory.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

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
          <p className="text-sm text-muted-foreground">Comprehensive business insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Overall revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
              <div className="text-sm text-muted-foreground">All orders processed</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Currently in inventory</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Gross Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{grossMargin.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Profit margin</div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales Reports</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Daily Sales (Z Report) */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales (Z Report)</CardTitle>
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
                <CardTitle>Product Performance</CardTitle>
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
                <CardTitle>Sales by Hour (Today)</CardTitle>
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
                <CardTitle>Top Products</CardTitle>
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
          <h2 className="text-xl font-semibold mb-4">Inventory Reports</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Stock-on-Hand */}
            <Card>
              <CardHeader>
                <CardTitle>Stock-on-Hand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)}</div>
                <div className="text-sm text-muted-foreground">Total items in stock</div>
              </CardContent>
            </Card>

            {/* Inventory Valuation */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${inventoryValuation.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Cost value of inventory</div>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{lowStockProducts.length}</div>
                <div className="text-sm text-muted-foreground">Items below threshold</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>${Number(product.cost_price).toFixed(2)}</TableCell>
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

        {/* Employee Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Employee Reports</h2>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Associate</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Associate</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByAssociateArray.length > 0 ? (
                    salesByAssociateArray.map((associate, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{associate.name}</TableCell>
                        <TableCell className="text-right">{associate.orders}</TableCell>
                        <TableCell className="text-right">${associate.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          ${(associate.orders > 0 ? associate.revenue / associate.orders : 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Customer Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Customer Reports</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer Loyalty */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers (VIPs)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.length > 0 ? (
                      topCustomers.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell className="text-right">{customer.orders}</TableCell>
                          <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No customer data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Purchase History */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.slice(0, 3).map((customer, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{customer.name}</h4>
                        <span className="text-sm font-semibold">${customer.totalSpent.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.orders} orders • ${(customer.orders > 0 ? customer.totalSpent / customer.orders : 0).toFixed(2)} avg
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
