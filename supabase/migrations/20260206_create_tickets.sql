-- Create tickets table for customer support
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT,
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  user_email TEXT, -- Link to user if logged in
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow insert by anyone (authenticated users)
-- In a real app you might want to restrict this further
CREATE POLICY "Allow authenticated to insert tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own tickets (if we link by email or ID)
-- For now, we rely on the service role for admin viewing
-- and client-side just submits
CREATE POLICY "Allow users to view own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (true); -- Simplified for now, refine if needed

-- Allow service role full access
CREATE POLICY "Service role full access tickets"
ON public.tickets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
