-- Add a boolean flag to mark whether stock refund was applied for an order
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS stock_refunded BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.cash_orders
ADD COLUMN IF NOT EXISTS stock_refunded BOOLEAN DEFAULT FALSE;

-- Backfill: if you have a way to detect refunded orders, update accordingly.
-- For safety, this migration only adds the column with default false.
