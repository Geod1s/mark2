"use client"

import React, { useState } from "react"
import SalesChart from "./sales-chart"

interface Series {
  label: string
  data: number[]
  color?: string
}

interface Props {
  monthlyCategories: string[]
  monthlySeries: Series[]
  weekCategories: string[]
  weekSeries: Series[]
  dayCategories: string[]
  daySeries: number[]
  hourCategories: string[]
  hourSeries: number[]
}

export default function SalesChartWrapper({ monthlyCategories, monthlySeries, weekCategories, weekSeries, dayCategories, daySeries, hourCategories, hourSeries }: Props) {
  const [view, setView] = useState<'monthly'|'weekly'|'daily'|'hourly'>('monthly')

  let categories: string[]
  let series: Series[]

  if (view === 'monthly') {
    categories = monthlyCategories
    series = monthlySeries
  } else if (view === 'weekly') {
    categories = weekCategories
    series = weekSeries
  } else if (view === 'daily') {
    categories = dayCategories
    series = [{ label: 'Daily', data: daySeries, color: '#06b6d4' }]
  } else {
    categories = hourCategories
    series = [{ label: 'Hourly', data: hourSeries, color: '#06b6d4' }]
  }

  // compute zoom override for daily/hourly to improve visibility (use 90th percentile)
  const computeZoom = (arr: number[]) => {
    if (!arr || arr.length === 0) return undefined
    const vals = arr.filter(v => Number.isFinite(v)).map(v => v)
    if (vals.length === 0) return undefined
    const sorted = vals.slice().sort((a, b) => a - b)
    const idx = Math.floor(sorted.length * 0.9)
    const p90 = sorted[Math.min(idx, sorted.length - 1)]
    // scale a bit above p90 so bars don't touch top
    const override = Math.max(1, p90 * 1.2)
    return override
  }
  let maxOverride: number | undefined = undefined
  if (view === 'daily') {
    maxOverride = computeZoom(daySeries)
  } else if (view === 'hourly') {
    maxOverride = computeZoom(hourSeries)
  }

  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex rounded-md bg-muted p-1">
          <button className={`px-3 py-1 rounded ${view==='monthly' ? 'bg-white text-black' : 'text-muted-foreground'}`} onClick={() => setView('monthly')}>Monthly</button>
          <button className={`px-3 py-1 rounded ${view==='weekly' ? 'bg-white text-black' : 'text-muted-foreground'}`} onClick={() => setView('weekly')}>Weekly</button>
          <button className={`px-3 py-1 rounded ${view==='daily' ? 'bg-white text-black' : 'text-muted-foreground'}`} onClick={() => setView('daily')}>Daily</button>
          <button className={`px-3 py-1 rounded ${view==='hourly' ? 'bg-white text-black' : 'text-muted-foreground'}`} onClick={() => setView('hourly')}>Hourly</button>
        </div>
      </div>
      <div className="w-full h-full">
        <SalesChart categories={categories} series={series} maxOverride={maxOverride} />
      </div>
    </div>
  )
}
