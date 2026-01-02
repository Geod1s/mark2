"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SimpleDateRangePicker } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingUp, Users, Package } from "lucide-react"

interface POSOrder {
  id: string;
  total_amount: number | string;
  created_at: string;
  items: any[] | string;
  customer_name?: string;
  payment_method: string;
  status: string;
  is_pos_order: boolean;
}

interface OrderItem {
  quantity: number;
  [key: string]: any;
}

export default function POSReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  })
  const [posOrders, setPosOrders] = useState<POSOrder[]>([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    itemsSold: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPOSData()
  }, [dateRange])

  const fetchPOSData = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: orders } = await supabase
      .from('cash_orders')
      .select('*')
      .eq('is_pos_order', true)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at', { ascending: false })

    if (orders) {
      setPosOrders(orders as POSOrder[])
      
      // Calculate stats with explicit types
      const totalRevenue = orders.reduce((sum: number, order: POSOrder) => 
        sum + Number(order.total_amount || 0), 0)
      
      const itemsSold = orders.reduce((sum: number, order: POSOrder) => {
        const items = Array.isArray(order.items) ? order.items : 
                     (typeof order.items === 'string' ? JSON.parse(order.items) : [])
        return sum + items.reduce((itemSum: number, item: OrderItem) => 
          itemSum + (item.quantity || 0), 0)
      }, 0)
      
      setStats({
        totalSales: orders.length,
        totalRevenue,
        averageSale: orders.length > 0 ? totalRevenue / orders.length : 0,
        itemsSold
      })
    }
    
    setLoading(false)
  }

  const exportToCSV = () => {
    const headers = ["Order ID", "Date", "Customer", "Items", "Total", "Payment Method", "Status"]
    const rows = posOrders.map(order => {
      const items = Array.isArray(order.items) ? order.items : 
                   (typeof order.items === 'string' ? JSON.parse(order.items) : [])
      return [
        order.id.slice(0, 8),
        new Date(order.created_at).toLocaleString(),
        order.customer_name || "Walk-in",
        items.length,
        `$${Number(order.total_amount || 0).toFixed(2)}`,
        order.payment_method,
        order.status
      ]
    })
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pos-sales-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">POS Reports</h2>
          <p className="text-muted-foreground">Track and analyze in-person sales</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <SimpleDateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">POS transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From POS sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageSale.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsSold}</div>
            <p className="text-xs text-muted-foreground">Total units sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent POS Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent POS Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : posOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No POS transactions in selected period</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : 
                               (typeof order.items === 'string' ? JSON.parse(order.items) : [])
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                      <TableCell>{order.customer_name || "Walk-in"}</TableCell>
                      <TableCell>{items.length} items</TableCell>
                      <TableCell className="font-medium">${Number(order.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${order.payment_method === 'cash' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {order.payment_method === 'cash' ? 'Cash' : 'Card'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${order.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}