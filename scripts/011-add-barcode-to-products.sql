-- Add barcode field to products table 
ALTER TABLE products  ADD COLUMN IF NOT EXISTS barcode TEXT; 
-- Add comment to document the barcode field 
COMMENT ON COLUMN products.barcode IS 'Product barcode (UPC, EAN, ISBN, etc.) for POS scanning'; 
