-- Atomic, idempotent refund function for orders (handles stripe and cash orders)
CREATE OR REPLACE FUNCTION public.refund_order_stock(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  o RECORD;
  rec RECORD;
BEGIN
  -- Try orders table (stripe orders)
  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF FOUND THEN
    IF o.stock_refunded THEN
      RETURN;
    END IF;

    FOR rec IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
      UPDATE public.products
      SET stock_quantity = COALESCE(stock_quantity, 0) + rec.quantity,
          updated_at = now()
      WHERE id = rec.product_id;
    END LOOP;

    UPDATE public.orders SET stock_refunded = TRUE, updated_at = now() WHERE id = p_order_id;
    RETURN;
  END IF;

  -- Try cash_orders table
  SELECT * INTO o FROM public.cash_orders WHERE id = p_order_id FOR UPDATE;
  IF FOUND THEN
    IF o.stock_refunded THEN
      RETURN;
    END IF;

    -- items expected as JSON array of objects with product_id and quantity
    FOR rec IN
      SELECT (elem->>'product_id')::uuid AS product_id, (elem->>'quantity')::int AS quantity
      FROM public.cash_orders, jsonb_array_elements(coalesce(cash_orders.items::jsonb, '[]'::jsonb)) elem
      WHERE cash_orders.id = p_order_id
    LOOP
      UPDATE public.products
      SET stock_quantity = COALESCE(stock_quantity, 0) + rec.quantity,
          updated_at = now()
      WHERE id = rec.product_id;
    END LOOP;

    UPDATE public.cash_orders SET stock_refunded = TRUE, updated_at = now() WHERE id = p_order_id;
    RETURN;
  END IF;

  -- If order not found, do nothing
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
