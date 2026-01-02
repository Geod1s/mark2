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