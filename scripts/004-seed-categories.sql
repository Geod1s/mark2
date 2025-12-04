-- Seed initial categories for the marketplace

INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Electronics', 'electronics', 'Gadgets, devices, and tech accessories', '/placeholder.svg?height=200&width=200'),
  ('Clothing', 'clothing', 'Fashion and apparel for all styles', '/placeholder.svg?height=200&width=200'),
  ('Home & Garden', 'home-garden', 'Everything for your home and outdoor spaces', '/placeholder.svg?height=200&width=200'),
  ('Sports & Outdoors', 'sports-outdoors', 'Gear for active lifestyles', '/placeholder.svg?height=200&width=200'),
  ('Beauty & Health', 'beauty-health', 'Personal care and wellness products', '/placeholder.svg?height=200&width=200'),
  ('Books & Media', 'books-media', 'Books, music, and entertainment', '/placeholder.svg?height=200&width=200'),
  ('Toys & Games', 'toys-games', 'Fun for all ages', '/placeholder.svg?height=200&width=200'),
  ('Food & Beverages', 'food-beverages', 'Gourmet foods and drinks', '/placeholder.svg?height=200&width=200')
ON CONFLICT (slug) DO NOTHING;
