# Inventory Triggers Feature

This feature allows users to configure automatic inventory alerts to prevent stockouts and avoid overstock situations.

## Setup

### 1. Database Setup

Run the following SQL to create the required table:

```sql
-- Create the inventory_settings table to store user-specific inventory thresholds
CREATE TABLE IF NOT EXISTS inventory_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    low_stock_threshold INTEGER DEFAULT 5 NOT NULL,
    overstock_threshold INTEGER DEFAULT 100 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS inventory_settings_user_id_idx ON inventory_settings(user_id);

-- Enable Row Level Security (RLS) if you want to restrict access to user's own settings
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read and update their own settings
CREATE POLICY "Users can read own inventory settings" ON inventory_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory settings" ON inventory_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory settings" ON inventory_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create a trigger to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_settings_updated_at 
    BEFORE UPDATE ON inventory_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### In Components

Use the `InventoryTrigger` component in your dashboard:

```tsx
import { InventoryTrigger } from '@/components/dashboard/inventory-trigger'

// In your component
<InventoryTrigger vendorId={vendorId} />
```

### Available Functions

- `updateInventoryThresholds(lowStockThreshold, overstockThreshold)`: Updates the inventory thresholds in the database
- `getVendorInventoryThresholds(vendorId)`: Retrieves the current inventory thresholds for a vendor

## Features

- **Low Stock Threshold**: Configure the minimum inventory level that triggers an alert
- **Overstock Threshold**: Configure the maximum inventory level that triggers an alert
- **Real-time Updates**: Changes are saved immediately to the database
- **User Authentication**: Only authenticated users can modify their own settings
- **Loading States**: Proper loading indicators during data fetch and save operations
- **Error Handling**: Comprehensive error handling and user feedback

## Security

- Row Level Security (RLS) ensures users can only access their own inventory settings
- Authentication required for all operations
- Input validation to prevent invalid threshold values