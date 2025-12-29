"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Store,
  Package,
  MapPin,
  ShoppingCart,
  CheckCircle,
  Clock,
  PackageCheck
} from "lucide-react"
import { InventoryLocation } from '@/lib/types'

interface BOPISManagerProps {
  locations: InventoryLocation[]
  bopisEnabled: boolean
  onBOPISToggle?: (enabled: boolean) => void
  onLocationBOPISToggle?: (locationId: string, enabled: boolean) => void
}

export function BOPISManager({ 
  locations, 
  bopisEnabled, 
  onBOPISToggle, 
  onLocationBOPISToggle 
}: BOPISManagerProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  
  const pickupLocations = locations.filter(loc => loc.is_pickup_location)
  const availableLocations = locations.filter(loc => loc.is_active)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          BOPIS (Buy Online, Pick Up In Store)
        </CardTitle>
        <CardDescription>
          Enable customers to purchase online and pick up at your locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="bopis-toggle">Enable BOPIS</Label>
                {bopisEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Allow customers to select store pickup during checkout
              </p>
            </div>
            <Switch
              id="bopis-toggle"
              checked={bopisEnabled}
              onCheckedChange={(checked) => {
                if (onBOPISToggle) {
                  onBOPISToggle(checked)
                }
              }}
            />
          </div>

          {bopisEnabled && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Available Pickup Locations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which locations will be available for BOPIS orders
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableLocations.map((location) => (
                    <div 
                      key={location.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {location.address}, {location.city}, {location.state}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={location.is_pickup_location}
                          onCheckedChange={(checked) => {
                            if (onLocationBOPISToggle) {
                              onLocationBOPISToggle(location.id, checked)
                            }
                          }}
                        />
                        
                        {location.is_pickup_location ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">BOPIS Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Ready Time</span>
                    </div>
                    <span className="text-sm">2 hours</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Hold Duration</span>
                    </div>
                    <span className="text-sm">48 hours</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Minimum Inventory</span>
                    </div>
                    <span className="text-sm">1 unit</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bopisEnabled && pickupLocations.length === 0 && (
            <div className="p-4 border border-dashed rounded-lg text-center">
              <Store className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h4 className="font-medium mb-1">No Pickup Locations Available</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Enable at least one location for BOPIS orders
              </p>
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Configure Locations
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}