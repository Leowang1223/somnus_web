-- Fix RLS circular dependency that prevents users from reading their own role
-- This migration removes policies that check users.role to grant SELECT permission
-- (which creates a deadlock since you need SELECT to read users.role)

-- Drop all existing policies that might have circular dependencies
DROP POLICY IF EXISTS "Allow auth callback to insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Owners can manage users" ON public.users;
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;

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

-- Note: We removed "Owners can view all users" policy because it had circular dependency
-- If you need owners to view all users, implement it via a server-side API route
-- that uses the service role client instead of client-side queries
