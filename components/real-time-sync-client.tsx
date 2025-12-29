'use client'

import { RealTimeSync } from '../real-time-sync'
import { useState, useEffect } from 'react'
import { toggleRealTimeSyncAction } from '@/lib/inventory-server-actions'

interface RealTimeSyncClientProps {
  vendorId: string
  initialSyncEnabled: boolean
}

export function RealTimeSyncClient({ vendorId, initialSyncEnabled }: RealTimeSyncClientProps) {
  const [syncEnabled, setSyncEnabled] = useState(initialSyncEnabled)

  const handleSyncToggle = async (enabled: boolean) => {
    setSyncEnabled(enabled)
    try {
      await toggleRealTimeSyncAction(vendorId, enabled)
    } catch (error) {
      console.error('Error toggling sync:', error)
      // Revert the state if there was an error
      setSyncEnabled(!enabled)
    }
  }

  // Update local state when initialSyncEnabled prop changes
  useEffect(() => {
    setSyncEnabled(initialSyncEnabled)
  }, [initialSyncEnabled])

  return (
    <RealTimeSync
      syncEnabled={syncEnabled}
      onSyncToggle={handleSyncToggle}
    />
  )
}
