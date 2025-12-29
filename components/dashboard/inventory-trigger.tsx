"use client"

import { AlertCircle, Bell, PackagePlus, PackageX, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { updateInventoryThresholds } from "@/lib/inventory-actions"

interface InventoryTriggerProps {
  initialLowStockThreshold?: number
  initialOverstockThreshold?: number
}

export function InventoryTrigger({
  initialLowStockThreshold = 5,
  initialOverstockThreshold = 100
}: InventoryTriggerProps) {
  const [lowStockThreshold, setLowStockThreshold] = useState(initialLowStockThreshold)
  const [overstockThreshold, setOverstockThreshold] = useState(initialOverstockThreshold)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const handleSaveThresholds = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const result = await updateInventoryThresholds(lowStockThreshold, overstockThreshold)
      if (result.success) {
        setSaveMessage("Thresholds updated successfully!")
      }
    } catch (error) {
      console.error("Error updating thresholds:", error)
      setSaveMessage("Error updating thresholds")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Inventory Triggers
        </CardTitle>
        <CardDescription>
          Configure automatic alerts to prevent stockouts and avoid overstock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Low Stock Threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                className="w-16 px-2 py-1 text-sm border rounded bg-background"
              />
              <span className="text-sm">units</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Overstock Threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="1000"
                value={overstockThreshold}
                onChange={(e) => setOverstockThreshold(parseInt(e.target.value) || 100)}
                className="w-16 px-2 py-1 text-sm border rounded bg-background"
              />
              <span className="text-sm">units</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <PackageX className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Out of Stock</span>
            </div>
            <span className="text-sm">0 units</span>
          </div>

          <Button
            onClick={handleSaveThresholds}
            disabled={isSaving}
            className="w-full mt-2"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Save Triggers
              </span>
            )}
          </Button>

          {saveMessage && (
            <p className={`text-sm text-center ${saveMessage.includes("Error") ? "text-destructive" : "text-emerald-600"}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}