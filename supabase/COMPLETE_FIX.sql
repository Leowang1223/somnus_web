-- ==========================================
-- COMPLETE SQL FIX FOR AUTHENTICATION ISSUES
-- ==========================================
-- This script fixes the RLS circular dependency that prevents users from reading their own role
-- Execute this entire script in Supabase SQL Editor
-- ==========================================

-- Step 1: Drop all existing RLS policies that might have circular dependencies
DROP POLICY IF EXISTS "Allow auth callback to insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Owners can manage users" ON public.users;
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Step 2: Create new RLS policies WITHOUT circular dependencies

-- Policy 1: Allow authenticated users to insert their own record
-- This allows new users to be created automatically on first login
CREATE POLICY "authenticated_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 2: Allow authenticated users to SELECT their own record
-- CRITICAL: No circular dependency - just checks auth.uid()
-- This allows users to read their own role without needing permission first
CREATE POLICY "authenticated_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 3: Allow UPDATE on own record
-- Users can update their own profile data
CREATE POLICY "authenticated_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role can do everything
-- This allows backend API routes using service role to manage all users
CREATE POLICY "service_role_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Ensure your user account exists and has the correct role
-- Replace 'your-email@example.com' with your actual email
-- This will create or update your user record to have 'owner' role

INSERT INTO public.users (id, email, role, name)
SELECT 
  id, 
  email,
  'owner' as role,
  COALESCE(raw_user_meta_data->>'full_name', email) as name
FROM auth.users
WHERE email = 'wls0905774796@gmail.com'  -- ← REPLACE WITH YOUR EMAIL
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'owner',
  updated_at = NOW();

-- Step 4: Verify the fix worked
-- This should return your user record with role = 'owner'
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'wls0905774796@gmail.com';  -- ← REPLACE WITH YOUR EMAIL

-- ==========================================
-- EXPECTED RESULT
-- ==========================================
-- You should see one row with:
-- - id: your UUID
-- - email: wls0905774796@gmail.com (or your email)
-- - role: owner
-- - created_at: timestamp
-- ==========================================
