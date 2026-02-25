-- Reconcile legacy tickets schema with the current support chat implementation.
-- Safe to run multiple times.
--
-- Problem this fixes:
-- Older environments may still have legacy NOT NULL columns on public.tickets:
--   customer_name, customer_email, subject, message
-- while the current app writes chat-style payloads:
--   type, department, order_id, messages, user_email, assigned_to
--
-- Result:
-- - keeps legacy columns for compatibility
-- - relaxes legacy NOT NULL constraints
-- - ensures new chat columns exist
-- - backfills messages from legacy message column when possible

BEGIN;

-- 1) Create tickets table if it does not exist (current chat-oriented shape).
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  user_email TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2) Ensure current app columns exist (for environments created from older migrations).
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- 3) Normalize defaults/nulls used by current support flow.
ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.tickets ALTER COLUMN department SET DEFAULT 'General';
UPDATE public.tickets
SET department = 'General'
WHERE department IS NULL;

UPDATE public.tickets
SET messages = '[]'::jsonb
WHERE messages IS NULL;

-- 4) Backfill chat messages from legacy `message` column if present and messages is empty.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tickets'
      AND column_name = 'message'
  ) THEN
    EXECUTE $sql$
      UPDATE public.tickets
      SET messages = jsonb_build_array(
        jsonb_build_object(
          'id', 'msg-legacy-' || COALESCE(id, md5(random()::text)),
          'sender', 'user',
          'content', COALESCE(message, ''),
          'timestamp', (EXTRACT(EPOCH FROM COALESCE(created_at, NOW())) * 1000)::bigint
        )
      )
      WHERE (messages IS NULL OR messages = '[]'::jsonb)
        AND message IS NOT NULL
        AND btrim(message) <> ''
    $sql$;
  END IF;
END $$;

-- 5) Relax legacy NOT NULL constraints that block current support inserts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.tickets ALTER COLUMN customer_name DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.tickets ALTER COLUMN customer_email DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.tickets ALTER COLUMN subject DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.tickets ALTER COLUMN message DROP NOT NULL;
  END IF;
END $$;

COMMIT;

-- Optional verification query (run manually):
-- select column_name, is_nullable, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'tickets'
-- order by ordinal_position;
