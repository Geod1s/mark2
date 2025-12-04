-- Triggers and Functions for automatic operations

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION TO UPGRADE USER TO VENDOR
-- ============================================
CREATE OR REPLACE FUNCTION public.create_vendor_profile(
  p_store_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_vendor_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a vendor profile
  IF EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User already has a vendor profile';
  END IF;

  -- Check if slug is available
  IF EXISTS (SELECT 1 FROM vendors WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Store slug already taken';
  END IF;

  -- Update user role to vendor
  UPDATE profiles SET role = 'vendor' WHERE id = auth.uid();

  -- Create vendor profile
  INSERT INTO vendors (user_id, store_name, slug, description)
  VALUES (auth.uid(), p_store_name, p_slug, p_description)
  RETURNING id INTO v_vendor_id;

  RETURN v_vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO GET VENDOR BY SLUG
-- ============================================
CREATE OR REPLACE FUNCTION public.get_vendor_storefront(p_slug TEXT)
RETURNS TABLE (
  vendor_id UUID,
  store_name TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vendor_id,
    v.store_name,
    v.description,
    v.logo_url,
    v.banner_url,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'slug', p.slug,
          'price', p.price,
          'compare_at_price', p.compare_at_price,
          'images', p.images,
          'description', p.description
        )
      ) FILTER (WHERE p.id IS NOT NULL AND p.is_active = true),
      '[]'::jsonb
    ) as products
  FROM vendors v
  LEFT JOIN products p ON p.vendor_id = v.id
  WHERE v.slug = p_slug AND v.is_active = true
  GROUP BY v.id, v.store_name, v.description, v.logo_url, v.banner_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO CALCULATE ORDER TOTAL
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_cart_total(p_user_id UUID)
RETURNS TABLE (
  total DECIMAL(10, 2),
  item_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(p.price * ci.quantity), 0)::DECIMAL(10, 2) as total,
    COALESCE(SUM(ci.quantity), 0)::INTEGER as item_count
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = p_user_id AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
