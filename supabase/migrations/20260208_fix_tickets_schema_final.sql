-- Fix tickets table schema and policies (Robust Version)

-- 1. Ensure the tickets table exists
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT,
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add user_email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_email') THEN
        ALTER TABLE public.tickets ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated to insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow users to view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role full access tickets" ON public.tickets;

-- 5. Re-create policies

-- Allow insert by any authenticated user
CREATE POLICY "Allow authenticated to insert tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view tickets where they are the owner
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
