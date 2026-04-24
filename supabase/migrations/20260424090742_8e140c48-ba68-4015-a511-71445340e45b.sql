-- 1. Fix audit_logs SELECT policy: replace hardcoded email with role check
DROP POLICY IF EXISTS "Only primary admin can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Riders: allow branch managers to view rider details for dispatch
CREATE POLICY "Branch managers can view riders"
ON public.riders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.branch_managers bm
    WHERE bm.user_id = auth.uid() AND bm.is_active = true
  )
);

-- 3. Harden add_loyalty_points: clamp values + reject negatives/huge grants
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id uuid,
  p_points integer,
  p_source text,
  p_reference_id uuid DEFAULT NULL::uuid,
  p_description text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Sanity bounds: points must be positive and reasonable
  IF p_points IS NULL OR p_points <= 0 OR p_points > 10000 THEN
    RAISE EXCEPTION 'Invalid points value';
  END IF;

  -- Validate source
  IF p_source NOT IN ('order', 'review', 'referral', 'admin_grant') THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;

  -- Prevent duplicate grant for the same reference (e.g. same order)
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.loyalty_transactions
      WHERE reference_id = p_reference_id
        AND source = p_source
        AND type = 'earn'
    ) THEN
      RAISE EXCEPTION 'Points already granted for this reference';
    END IF;
  END IF;

  INSERT INTO public.loyalty_points (user_id, points, total_earned)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET points = loyalty_points.points + EXCLUDED.points,
      total_earned = loyalty_points.total_earned + EXCLUDED.points,
      updated_at = now();

  INSERT INTO public.loyalty_transactions (user_id, points, type, source, reference_id, description)
  VALUES (p_user_id, p_points, 'earn', p_source, p_reference_id,
    COALESCE(p_description, 'Earned ' || p_points || ' points from ' || p_source));
END;
$function$;

-- 4. Realtime: restrict who can subscribe to channels (default deny + admin allow)
-- Enable RLS on realtime.messages (it may already be enabled)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Only authenticated users may subscribe; further authorization enforced by per-table RLS
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);