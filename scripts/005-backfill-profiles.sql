-- Backfill profiles for existing auth users who signed up before the trigger was created
-- This ensures all existing users have a profile entry

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'customer'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;
