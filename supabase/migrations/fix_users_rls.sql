-- Fix RLS policies for users table to allow auth callback to insert new users

-- Allow Service Role and authenticated users to insert
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow auth callback to insert users" ON public.users;

-- New policy: Allow authenticated users to insert their own record
CREATE POLICY "Allow auth callback to insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure authenticated users can read their own data (should already exist, but just in case)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow owners to do everything (should already exist)
DROP POLICY IF EXISTS "Owners can manage users" ON public.users;
CREATE POLICY "Owners can manage users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Allow owners to view all users (should already exist)
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
CREATE POLICY "Owners can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );
