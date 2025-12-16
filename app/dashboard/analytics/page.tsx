import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import SalesChartWrapper from "@/components/analytics/sales-chart-wrapper"
import { DashboardLayout } from "@/components/dashboard/layout"
import { redirect } from "next/navigation"

type TopProduct = { id: string; name: string; sold: number }

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

  // Fetch orders and cash orders (small datasets expected)
  const [{ data: ordersData }, { data: cashOrdersData }, { data: productsData }, { data: orderItemsData }] = await Promise.all([
    supabase.from('orders').select('id, total_amount, created_at'),
    supabase.from('cash_orders').select('id, total_amount, items, created_at'),
    supabase.from('products').select('id').eq('is_active', true),
    supabase.from('order_items').select('product_id, quantity'),
  ])

  const orders = ordersData ?? []
  const cashOrders = cashOrdersData ?? []
  const activeProducts = productsData ?? []
  const orderItems = orderItemsData ?? []

  // Orders count
  const totalOrders = (orders.length ?? 0) + (cashOrders.length ?? 0)

  // Revenue sum
  const revenueFromOrders = (orders as any[]).reduce((s, o) => s + (Number(o.total_amount) || 0), 0)
  const revenueFromCash = (cashOrders as any[]).reduce((s, o) => s + (Number(o.total_amount) || 0), 0)
  const totalRevenue = revenueFromOrders + revenueFromCash

  // Top products: aggregate quantities from order_items and cash_orders.items
  const productSales = new Map<string, number>()

  // From order_items
  for (const it of orderItems as any[]) {
    const pid = it.product_id
    const q = Number(it.quantity) || 0
    productSales.set(pid, (productSales.get(pid) || 0) + q)
  }

  // From cash_orders items (items stored as JSON)
  for (const co of cashOrders ?? []) {
    const itemsField = (co as any).items
    if (!itemsField) continue
    try {
      const parsed = Array.isArray(itemsField) ? itemsField : JSON.parse(itemsField)
      for (const it of parsed) {
        const pid = it.product_id || it.id
        const q = Number(it.quantity) || 0
        if (!pid) continue
        productSales.set(pid, (productSales.get(pid) || 0) + q)
      }
    } catch {
      // ignore parse errors
    }
  }

  // Get top product ids
  const top = Array.from(productSales.entries())
    .map(([id, sold]) => ({ id, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)

  // Fetch product names for top products
  const topIds = top.map(t => t.id)
  let topProducts: TopProduct[] = []
  if (topIds.length > 0) {
    const { data: topNames } = await supabase.from('products').select('id, name').in('id', topIds)
    const nameMap = new Map((topNames ?? []).map((p: any) => [p.id, p.name]))
    topProducts = top.map(t => ({ id: t.id, name: nameMap.get(t.id) || 'Unknown', sold: t.sold }))
  }

  // Build monthly sales series for current year vs previous year (Jan..Dec)
  const now = new Date()
  const currentYear = now.getFullYear()
  const previousYear = currentYear - 1
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const totalsCurrent = new Array(12).fill(0)
  const totalsPrevious = new Array(12).fill(0)

  const addMonthly = (createdAt: any, amount: any) => {
    if (!createdAt) return
    const d = new Date(createdAt)
    if (isNaN(d.getTime())) return
    const y = d.getFullYear()
    const m = d.getMonth()
    const v = Number(amount) || 0
    if (y === currentYear) totalsCurrent[m] += v
    if (y === previousYear) totalsPrevious[m] += v
  }

  for (const o of orders ?? []) {
    addMonthly((o as any).created_at, (o as any).total_amount)
  }
  for (const co of cashOrders ?? []) {
    addMonthly((co as any).created_at, (co as any).total_amount)
  }

  const salesCategories = months
  const salesSeries = [
    { label: String(currentYear), data: totalsCurrent, color: '#06b6d4' },
    { label: String(previousYear), data: totalsPrevious, color: '#fbbf24' },
  ]

  // Weekly: last 7 days, compare to previous 7-day period
  const wkDates: Date[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    wkDates.push(d)
  }
  const weekLabels = wkDates.map(d => d.toLocaleDateString(undefined, { weekday: 'short' }))
  const weekCurrent = new Array(7).fill(0)
  const weekPrevious = new Array(7).fill(0)
  for (let i = 0; i < 7; i++) {
    const day = wkDates[i]
    const key = day.toISOString().slice(0, 10)
    // sum for that day
    let sumCur = 0
    let sumPrev = 0
    for (const o of orders ?? []) {
      const t = (o as any).created_at
      if (!t) continue
      const d = new Date(t)
      const dk = d.toISOString().slice(0, 10)
      if (dk === key) sumCur += Number((o as any).total_amount) || 0
      const prevKey = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7).toISOString().slice(0, 10)
      if (dk === prevKey) sumPrev += Number((o as any).total_amount) || 0
    }
    for (const co of cashOrders ?? []) {
      const t = (co as any).created_at
      if (!t) continue
      const d = new Date(t)
      const dk = d.toISOString().slice(0, 10)
      if (dk === key) sumCur += Number((co as any).total_amount) || 0
      const prevKey = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7).toISOString().slice(0, 10)
      if (dk === prevKey) sumPrev += Number((co as any).total_amount) || 0
    }
    weekCurrent[i] = sumCur
    weekPrevious[i] = sumPrev
  }

  // Daily: last 30 days (single series)
  const days = 30
  const dayLabels: string[] = []
  const dayTotals = new Array(days).fill(0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    dayLabels.push(label)
    const key = d.toISOString().slice(0, 10)
    let sum = 0
    for (const o of orders ?? []) {
      const dk = new Date((o as any).created_at || 0).toISOString().slice(0, 10)
      if (dk === key) sum += Number((o as any).total_amount) || 0
    }
    for (const co of cashOrders ?? []) {
      const dk = new Date((co as any).created_at || 0).toISOString().slice(0, 10)
      if (dk === key) sum += Number((co as any).total_amount) || 0
    }
    dayTotals[days - 1 - i] = sum
  }

  // Hourly: today 24 hours
  const hourLabels = Array.from({ length: 24 }).map((_, h) => `${h}:00`)
  const hourTotals = new Array(24).fill(0)
  const todayKey = new Date(now).toISOString().slice(0, 10)
  for (const o of orders ?? []) {
    const d = new Date((o as any).created_at || 0)
    if (d.toISOString().slice(0, 10) !== todayKey) continue
    const h = d.getHours()
    hourTotals[h] += Number((o as any).total_amount) || 0
  }
  for (const co of cashOrders ?? []) {
    const d = new Date((co as any).created_at || 0)
    if (d.toISOString().slice(0, 10) !== todayKey) continue
    const h = d.getHours()
    hourTotals[h] += Number((co as any).total_amount) || 0
  }

  return (
    <DashboardLayout vendor={vendor}>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Overview of store performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <div className="text-sm text-muted-foreground">Total orders</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProducts.length}</div>
            <div className="text-sm text-muted-foreground">Active products</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.length === 0 && (
                <div className="text-sm text-muted-foreground">No sales yet</div>
              )}
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="text-sm">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.sold} sold</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
<Card>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              
              <SalesChartWrapper
                monthlyCategories={salesCategories}
                monthlySeries={salesSeries}
                weekCategories={weekLabels}
                weekSeries={[{ label: 'This Week', data: weekCurrent, color: '#06b6d4' }, { label: 'Prev Week', data: weekPrevious, color: '#fbbf24' }]}
                dayCategories={dayLabels}
                daySeries={dayTotals}
                hourCategories={hourLabels}
                hourSeries={hourTotals}
              />
            </div>
          </CardContent>
        </Card>
      {/* <div className="mt-6 text-sm text-muted-foreground">Data from {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Supabase'}</div> */}
      </div>
    </DashboardLayout>
  )
}
