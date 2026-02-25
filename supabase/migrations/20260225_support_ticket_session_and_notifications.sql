-- Support ticket lifecycle/session metadata for auto-resume, queue sorting and unread indicators.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS last_message_sender TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_last_read_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS admin_last_read_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Backfill last message metadata from existing messages JSON.
-- Use a CTE first because UPDATE ... FROM LATERAL cannot safely reference the target table alias here.
WITH latest_ticket_message AS (
  SELECT
    t.id,
    m.elem
  FROM public.tickets t
  LEFT JOIN LATERAL (
    SELECT elem
    FROM jsonb_array_elements(COALESCE(t.messages, '[]'::jsonb)) elem
    ORDER BY (elem->>'timestamp')::bigint DESC NULLS LAST
    LIMIT 1
  ) m ON TRUE
)
UPDATE public.tickets t
SET
  last_message_at = COALESCE(
    t.last_message_at,
    CASE
      WHEN ltm.elem IS NOT NULL AND (ltm.elem->>'timestamp') IS NOT NULL
      THEN to_timestamp(((ltm.elem->>'timestamp')::bigint) / 1000.0)
      ELSE t.last_message_at
    END
  ),
  last_message_preview = COALESCE(
    t.last_message_preview,
    NULLIF(left(COALESCE(ltm.elem->>'content', '[image]'), 200), '')
  ),
  last_message_sender = COALESCE(t.last_message_sender, ltm.elem->>'sender')
FROM latest_ticket_message ltm
WHERE t.id = ltm.id;

-- If status already indicates closed/resolved, backfill timestamps using updated_at.
UPDATE public.tickets
SET resolved_at = COALESCE(resolved_at, updated_at)
WHERE status = 'resolved' AND resolved_at IS NULL;

UPDATE public.tickets
SET closed_at = COALESCE(closed_at, updated_at)
WHERE status = 'closed' AND closed_at IS NULL;

-- Queue/order performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_email_status_last_message
  ON public.tickets (user_email, status, last_message_at DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_status_assigned_last_message
  ON public.tickets (status, assigned_to, last_message_at DESC, updated_at DESC);

COMMIT;
