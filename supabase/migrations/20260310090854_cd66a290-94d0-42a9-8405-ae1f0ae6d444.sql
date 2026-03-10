
-- 1. Drop permissive user UPDATE policy on loyalty_points
DROP POLICY IF EXISTS "Users can update their own loyalty points" ON public.loyalty_points;

-- 2. Drop permissive user INSERT policy on loyalty_points
DROP POLICY IF EXISTS "Users can insert their own loyalty points" ON public.loyalty_points;

-- 3. Drop permissive user INSERT policy on loyalty_transactions
DROP POLICY IF EXISTS "Users can insert their own loyalty transactions" ON public.loyalty_transactions;

-- 4. Create atomic function to add loyalty points (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- 5. Create atomic function to redeem loyalty points (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points INTEGER;
BEGIN
  SELECT points INTO current_points
  FROM public.loyalty_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_points IS NULL OR current_points < p_points THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  UPDATE public.loyalty_points
  SET points = points - p_points,
      total_redeemed = total_redeemed + p_points,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.loyalty_transactions (user_id, points, type, source, description)
  VALUES (p_user_id, p_points, 'redeem', 'discount', 
    COALESCE(p_description, 'Redeemed ' || p_points || ' points'));
END;
$$;
