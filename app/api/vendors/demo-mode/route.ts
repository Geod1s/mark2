// app/api/vendors/demo-mode/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { vendorId } = await request.json()

    // In a real implementation, you might set a demo flag for the vendor
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Demo mode activated for vendor' 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to activate demo mode' }, { status: 500 })
  }
}