"use client"

import { AlertCircle, Bell, PackagePlus, PackageX, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { updateInventoryThresholds, getVendorInventoryThresholds } from "@/lib/inventory-actions"
import { useRouter } from 'next/navigation'

interface InventoryTriggerProps {
  vendorId?: string
}

export function InventoryTrigger({ vendorId }: InventoryTriggerProps) {
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [overstockThreshold, setOverstockThreshold] = useState(100)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState("")
  const router = useRouter()

  // Load initial thresholds from the database
  useEffect(() => {
    const loadThresholds = async () => {
      if (vendorId) {
        try {
          const thresholds = await getVendorInventoryThresholds(vendorId)
          setLowStockThreshold(thresholds.lowStockThreshold)
          setOverstockThreshold(thresholds.overstockThreshold)
        } catch (error) {
          console.error("Error loading thresholds:", error)
          setSaveMessage("Error loading thresholds")
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadThresholds()
  }, [vendorId])

  const handleSaveThresholds = async () => {
    // Optimistic UI: remember previous values and show saving state immediately
    const prevLow = lowStockThreshold
    const prevOver = overstockThreshold

    setIsSaving(true)
    setSaveMessage("Saving...")

    try {
      const result = await updateInventoryThresholds(lowStockThreshold, overstockThreshold)

      if (result && result.success) {
        setSaveMessage("Thresholds updated successfully!")
        router.refresh() // Refresh server-rendered data so ProductsList and dashboard reflect new thresholds
      } else {
        // Revert on failure
        setLowStockThreshold(prevLow)
        setOverstockThreshold(prevOver)
        setSaveMessage(result?.message || "Error updating thresholds")
      }
    } catch (error) {
      console.error("Error updating thresholds:", error)
      setLowStockThreshold(prevLow)
      setOverstockThreshold(prevOver)
      setSaveMessage("Error updating thresholds")
    } finally {
      setIsSaving(false)
      // Clear message after a short delay
      setTimeout(() => setSaveMessage(''), 3000)
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
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 animate-spin" />
              <span>Loading thresholds...</span>
            </div>
          </div>
        ) : (
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
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                  className="w-16 px-2 py-1 text-sm border rounded bg-background"
                  disabled={isSaving || isLoading}
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
                  disabled={isSaving || isLoading}
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
              disabled={isSaving || isLoading}
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
        )}
      </CardContent>
    </Card>
  )
}