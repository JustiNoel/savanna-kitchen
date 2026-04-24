-- 1. Allow admins to update any profile (needed for branch-manager assignment)
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Backfill: copy branch_id from branch_managers to profiles for active managers
UPDATE public.profiles p
SET branch_id = bm.branch_id
FROM public.branch_managers bm
WHERE bm.user_id = p.user_id
  AND bm.is_active = true
  AND p.branch_id IS NULL;

-- 3. Auto-refund trigger when an order is cancelled
CREATE OR REPLACE FUNCTION public.handle_order_cancellation_finance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  income_row RECORD;
BEGIN
  -- Only act when status transitions TO cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Find the original income row for this order, if any
    SELECT * INTO income_row
    FROM public.financial_transactions
    WHERE order_id = NEW.id AND type = 'income'
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      -- Skip if a refund already exists for this order
      IF NOT EXISTS (
        SELECT 1 FROM public.financial_transactions
        WHERE order_id = NEW.id AND type = 'refund'
      ) THEN
        INSERT INTO public.financial_transactions
          (order_id, type, category, amount, description, payment_method, reference_number)
        VALUES
          (NEW.id, 'refund', 'order_cancellation', income_row.amount,
           'Auto-refund: order #' || substring(NEW.id::text, 1, 8) || ' cancelled',
           income_row.payment_method, income_row.reference_number);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_cancellation_finance ON public.orders;
CREATE TRIGGER trg_order_cancellation_finance
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_cancellation_finance();

-- 4. One-time backfill: insert refund rows for already-cancelled orders that have income
INSERT INTO public.financial_transactions
  (order_id, type, category, amount, description, payment_method, reference_number)
SELECT
  o.id,
  'refund',
  'order_cancellation',
  ft.amount,
  'Backfill refund: order #' || substring(o.id::text, 1, 8) || ' was cancelled',
  ft.payment_method,
  ft.reference_number
FROM public.orders o
JOIN LATERAL (
  SELECT amount, payment_method, reference_number
  FROM public.financial_transactions
  WHERE order_id = o.id AND type = 'income'
  ORDER BY created_at ASC
  LIMIT 1
) ft ON true
WHERE o.status = 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_transactions
    WHERE order_id = o.id AND type = 'refund'
  );

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id ON public.financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON public.menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_branch_managers_user_id ON public.branch_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_managers_branch_id ON public.branch_managers(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);