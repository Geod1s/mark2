-- Add expiration and production date fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS production_date DATE,
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Add comments to document the new columns
COMMENT ON COLUMN products.production_date IS 'Date when the product was manufactured/produced';
COMMENT ON COLUMN products.expiration_date IS 'Date when the product expires/should not be used after';