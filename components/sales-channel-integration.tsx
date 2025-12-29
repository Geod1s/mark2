"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  ShoppingCart, 
  Store, 
  Package, 
  Globe, 
  Settings,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react"
import { InventorySyncConfig } from '@/lib/types'

interface SalesChannelIntegrationProps {
  vendorId: string
  syncConfigs: InventorySyncConfig[]
  onSyncConfigsChange?: (configs: InventorySyncConfig[]) => void
}

export function SalesChannelIntegration({ 
  vendorId, 
  syncConfigs, 
  onSyncConfigsChange 
}: SalesChannelIntegrationProps) {
  const [channelSettings, setChannelSettings] = useState({
    ecommerce: true,
    marketplace: false,
    pos: false,
    custom: false
  })

  const [syncFrequency, setSyncFrequency] = useState<'real_time' | 'hourly' | 'daily' | 'manual'>('hourly')

  const channels = [
    {
      id: 'ecommerce',
      name: 'E-commerce Store',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Your main online store',
      connected: true,
      lastSync: new Date().toISOString()
    },
    {
      id: 'marketplace',
      name: 'Marketplaces',
      icon: <Store className="h-5 w-5" />,
      description: 'Amazon, eBay, Etsy, etc.',
      connected: false,
      lastSync: null
    },
    {
      id: 'pos',
      name: 'Point of Sale',
      icon: <Package className="h-5 w-5" />,
      description: 'Physical store POS system',
      connected: false,
      lastSync: null
    },
    {
      id: 'custom',
      name: 'Custom Channel',
      icon: <Globe className="h-5 w-5" />,
      description: 'Other sales channels',
      connected: false,
      lastSync: null
    }
  ]

  const handleChannelToggle = (channelId: string) => {
    setChannelSettings(prev => ({
      ...prev,
      [channelId]: !prev[channelId as keyof typeof prev]
    }))

    // Update sync config
    const existingConfig = syncConfigs.find(c => c.channel_type === channelId)
    if (existingConfig) {
      const updatedConfigs = syncConfigs.map(config => 
        config.channel_type === channelId 
          ? { ...config, sync_enabled: !config.sync_enabled } 
          : config
      )
      if (onSyncConfigsChange) {
        onSyncConfigsChange(updatedConfigs)
      }
    } else {
      const newConfig: InventorySyncConfig = {
        id: `sync_${Date.now()}`,
        vendor_id: vendorId,
        channel_type: channelId as any,
        channel_id: `channel_${channelId}`,
        sync_enabled: true,
        sync_frequency: syncFrequency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      if (onSyncConfigsChange) {
        onSyncConfigsChange([...syncConfigs, newConfig])
      }
    }
  }

  const handleSyncFrequencyChange = (frequency: 'real_time' | 'hourly' | 'daily' | 'manual') => {
    setSyncFrequency(frequency)

    // Update all configs with new frequency
    const updatedConfigs = syncConfigs.map(config => ({
      ...config,
      sync_frequency: frequency
    }))
    if (onSyncConfigsChange) {
      onSyncConfigsChange(updatedConfigs)
    }
  }

  const handleManualSync = (channelId: string) => {
    alert(`Manual sync initiated for ${channelId}`)
    // In a real app, this would trigger a sync
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Sales Channel Integration
        </CardTitle>
        <CardDescription>
          Connect and synchronize inventory across all sales channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="real_time">Real-time</Label>
              <Switch
                id="real_time"
                checked={syncFrequency === 'real_time'}
                onCheckedChange={() => handleSyncFrequencyChange('real_time')}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="hourly">Hourly</Label>
              <Switch
                id="hourly"
                checked={syncFrequency === 'hourly'}
                onCheckedChange={() => handleSyncFrequencyChange('hourly')}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="daily">Daily</Label>
              <Switch
                id="daily"
                checked={syncFrequency === 'daily'}
                onCheckedChange={() => handleSyncFrequencyChange('daily')}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="manual">Manual</Label>
              <Switch
                id="manual"
                checked={syncFrequency === 'manual'}
                onCheckedChange={() => handleSyncFrequencyChange('manual')}
              />
            </div>
          </div>

          <div className="space-y-4">
            {channels.map((channel) => {
              const config = syncConfigs.find(c => c.channel_type === channel.id)
              const isEnabled = config ? config.sync_enabled : false
              
              return (
                <div 
                  key={channel.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {channel.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{channel.name}</h3>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {channel.lastSync && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(channel.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleChannelToggle(channel.id)}
                    />
                    
                    {isEnabled && syncFrequency === 'manual' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleManualSync(channel.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync Now
                      </Button>
                    )}
                    
                    {isEnabled ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Connected</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Sync Settings</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Real-time: Changes sync immediately across all channels</p>
              <p>• Hourly/Daily: Changes sync at scheduled intervals</p>
              <p>• Manual: Sync when you initiate it</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}