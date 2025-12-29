"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Warehouse, Store, Package, Truck, Navigation, PackageCheck } from "lucide-react"
import { InventoryLocation } from '@/lib/types'

interface FulfillmentLocationMapperProps {
  locations: InventoryLocation[]
  onLocationSelect?: (location: InventoryLocation) => void
}

export function FulfillmentLocationMapper({ locations, onLocationSelect }: FulfillmentLocationMapperProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Warehouse className="h-4 w-4" />
      case 'store': return <Store className="h-4 w-4" />
      case 'distribution_center': return <Truck className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getLocationBadgeVariant = (type: string) => {
    switch (type) {
      case 'warehouse': return 'bg-blue-100 text-blue-800'
      case 'store': return 'bg-green-100 text-green-800'
      case 'distribution_center': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLocationClick = (location: InventoryLocation) => {
    setSelectedLocation(location.id)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Fulfillment Locations
        </CardTitle>
        <CardDescription>
          Map of your warehouses and stores for order fulfillment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div 
                key={location.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedLocation === location.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleLocationClick(location)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getLocationIcon(location.type)}
                    <h3 className="font-medium">{location.name}</h3>
                  </div>
                  <Badge className={getLocationBadgeVariant(location.type)}>
                    {location.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                  <p>{location.address}</p>
                  <p>{location.city}, {location.state} {location.postal_code}</p>
                  <p>{location.country}</p>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {location.is_pickup_location && (
                    <Badge variant="secondary" className="text-xs">
                      <PackageCheck className="h-3 w-3 mr-1" />
                      BOPIS
                    </Badge>
                  )}
                  {location.is_shipping_origin && (
                    <Badge variant="secondary" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      Shipping
                    </Badge>
                  )}
                  {!location.is_active && (
                    <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedLocation && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Fulfillment Options</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Navigation className="h-4 w-4 mr-1" />
                  Route Orders Here
                </Button>
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-1" />
                  Transfer Inventory
                </Button>
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-1" />
                  Set as Origin
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}