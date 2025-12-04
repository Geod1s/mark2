-- Fix: Add INSERT policy for profiles table
-- This allows users to create their own profile if the trigger didn't run

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
