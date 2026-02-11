-- Fix tickets table and policies (Idempotent)

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT,
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (safe to run multiple times)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid 42710 errors
DROP POLICY IF EXISTS "Allow authenticated to insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow users to view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role full access tickets" ON public.tickets;

-- 4. Re-create policies

-- Allow insert by any authenticated user
CREATE POLICY "Allow authenticated to insert tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view tickets where they are the owner (by email)
-- (Assuming user_email is set correctly)
CREATE POLICY "Allow users to view own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  user_email = auth.jwt() ->> 'email'
);

-- Allow service role full access
CREATE POLICY "Service role full access tickets"
ON public.tickets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
