"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Navigation, 
  MapPin, 
  Package, 
  Store, 
  Truck, 
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { InventoryLocation } from '@/lib/types'

interface OrderRoutingRulesProps {
  locations: InventoryLocation[]
  onRoutingRuleChange?: (rule: string) => void
}

export function OrderRoutingRules({ locations, onRoutingRuleChange }: OrderRoutingRulesProps) {
  const [selectedRule, setSelectedRule] = useState('closest_location')
  const [selectedLocationForRule, setSelectedLocationForRule] = useState<string | null>(null)
  
  const routingRules = [
    {
      id: 'closest_location',
      name: 'Closest Location',
      description: 'Route orders to the nearest available location',
      icon: <Navigation className="h-4 w-4" />
    },
    {
      id: 'highest_availability',
      name: 'Highest Availability',
      description: 'Route orders to locations with the most inventory',
      icon: <Package className="h-4 w-4" />
    },
    {
      id: 'preferred_location',
      name: 'Preferred Location',
      description: 'Always route to a specific location',
      icon: <MapPin className="h-4 w-4" />
    },
    {
      id: 'balanced_distribution',
      name: 'Balanced Distribution',
      description: 'Distribute orders evenly across locations',
      icon: <Truck className="h-4 w-4" />
    }
  ]

  const handleRuleChange = (ruleId: string) => {
    setSelectedRule(ruleId)
    if (onRoutingRuleChange) {
      onRoutingRuleChange(ruleId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Routing Rules
        </CardTitle>
        <CardDescription>
          Define how orders should be routed to fulfillment locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <RadioGroup value={selectedRule} onValueChange={handleRuleChange} className="grid gap-4">
            {routingRules.map((rule) => (
              <div 
                key={rule.id} 
                className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                  selectedRule === rule.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50 cursor-pointer'
                }`}
                onClick={() => handleRuleChange(rule.id)}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem 
                    value={rule.id} 
                    id={rule.id}
                    className="peer sr-only"
                  />
                  <div className="flex size-5 items-center justify-center rounded-full border border-primary text-primary peer-aria-checked:ring-2 peer-aria-checked:ring-primary peer-aria-checked:ring-offset-2">
                    {selectedRule === rule.id && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <Label 
                      htmlFor={rule.id} 
                      className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {rule.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {rule.description}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  {rule.icon}
                </div>
              </div>
            ))}
          </RadioGroup>

          {selectedRule === 'preferred_location' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                Preferred Location
              </h3>
              <div className="space-y-2">
                <Label>Select the location for all orders</Label>
                <Select value={selectedLocationForRule || ''} onValueChange={setSelectedLocationForRule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.type.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Routing Priority</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Orders will be routed based on the selected rule</p>
              <p>• If the primary location is unavailable, orders will be routed to the next best option</p>
              <p>• BOPIS orders will always be routed to the customer's selected pickup location</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}