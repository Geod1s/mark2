use client 
 
import { RealTimeSync } from './real-time-sync' 
import { useState } from 'react' 
import { toggleRealTimeSyncAction } from '../lib/inventory-server-actions' 
 
interface RealTimeSyncWrapperProps { 
  vendorId: string 
  initialSyncEnabled: boolean 
} 
 
export function RealTimeSyncWrapper({ vendorId, initialSyncEnabled }: RealTimeSyncWrapperProps) { 
  const [syncEnabled, setSyncEnabled] = useState(initialSyncEnabled) 
 
  const handleSyncToggle = async (enabled: boolean) =
  const handleSyncToggle = async (enabled: boolean) =
