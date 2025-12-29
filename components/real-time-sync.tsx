"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  ShoppingCart, 
  Store,
  Zap
} from "lucide-react"

interface RealTimeSyncProps {
  syncEnabled: boolean
  onSyncToggle?: (enabled: boolean) => void
  lastSyncTime?: Date
  onManualSync?: () => void
}

export function RealTimeSync({
  syncEnabled,
  onSyncToggle,
  lastSyncTime,
  onManualSync
}: RealTimeSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [localSyncEnabled, setLocalSyncEnabled] = useState(syncEnabled)

  // Update local state when syncEnabled prop changes
  useEffect(() => {
    setLocalSyncEnabled(syncEnabled)
  }, [syncEnabled])
  
  const channels = [
    { id: 'ecommerce', name: 'E-commerce Store', connected: true, synced: true },
    { id: 'marketplace', name: 'Marketplaces', connected: false, synced: false },
    { id: 'pos', name: 'POS System', connected: false, synced: false },
    { id: 'custom', name: 'Custom Channel', connected: false, synced: false }
  ]

  const handleManualSync = async () => {
    if (onManualSync) {
      onManualSync()
      return
    }
    
    setIsSyncing(true)
    setStatus('syncing')
    setProgress(0)
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsSyncing(false)
          setStatus('success')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Real-Time Stock Synchronization
        </CardTitle>
        <CardDescription>
          Keep inventory levels in sync across all sales channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="sync-toggle">Enable Real-Time Sync</Label>
                {syncEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Inventory changes will sync automatically across all channels
              </p>
            </div>
            <Switch
              id="sync-toggle"
              checked={localSyncEnabled}
              onCheckedChange={(checked) => {
                setLocalSyncEnabled(checked);
                if (onSyncToggle) {
                  onSyncToggle(checked)
                }
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Sync Status</h3>
              <div className="flex items-center gap-2">
                {status === 'syncing' && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </div>
                )}
                {status === 'success' && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Synced
                  </div>
                )}
                {status === 'idle' && lastSyncTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>

            {isSyncing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Synchronizing inventory across channels...
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((channel) => (
                <div 
                  key={channel.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {channel.id === 'ecommerce' && <ShoppingCart className="h-5 w-5 text-blue-500" />}
                    {channel.id === 'marketplace' && <Store className="h-5 w-5 text-green-500" />}
                    {channel.id === 'pos' && <Package className="h-5 w-5 text-purple-500" />}
                    {channel.id === 'custom' && <Store className="h-5 w-5 text-orange-500" />}
                    <span className="font-medium">{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {channel.connected ? (
                      <Badge variant={channel.synced ? "default" : "secondary"}>
                        {channel.synced ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Synced
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleManualSync}
              disabled={isSyncing || !syncEnabled}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}