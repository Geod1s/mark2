"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  date: DateRange
  onDateChange: (date: DateRange) => void
  className?: string
  disabled?: boolean
}

export function SimpleDateRangePicker({ date, onDateChange, className, disabled }: DateRangePickerProps) {
  const [startDate, setStartDate] = React.useState<string>(
    date.from ? date.from.toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = React.useState<string>(
    date.to ? date.to.toISOString().split('T')[0] : ''
  )

  React.useEffect(() => {
    if (startDate && endDate) {
      onDateChange({
        from: new Date(startDate),
        to: new Date(endDate)
      })
    }
  }, [startDate, endDate, onDateChange])

  const quickRanges = {
    "Today": () => {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      return { from: start, to: end }
    },
    "Yesterday": () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      return { from: start, to: end }
    },
    "Last 7 Days": () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return { from: start, to: end }
    },
    "This Month": () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { from: start, to: end }
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            disabled={disabled}
            max={endDate || new Date().toISOString().split('T')[0]}
          />
        </div>
        <span className="pt-5">→</span>
        <div className="relative flex-1">
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            disabled={disabled}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(quickRanges).map(([label, rangeFn]) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const range = rangeFn()
              setStartDate(range.from.toISOString().split('T')[0])
              setEndDate(range.to.toISOString().split('T')[0])
              onDateChange(range)
            }}
            disabled={disabled}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}