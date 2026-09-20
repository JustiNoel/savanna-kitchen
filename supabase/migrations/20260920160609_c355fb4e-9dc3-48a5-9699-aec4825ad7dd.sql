ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_total numeric NOT NULL DEFAULT 0;

-- 1. Order insert integrity: clients may never self-report payment state
CREATE OR REPLACE FUNCTION public.enforce_order_insert_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.payment_status := 'pending';
    IF NEW.total_amount IS NULL OR NEW.total_amount < 0 THEN
      RAISE EXCEPTION 'Invalid order amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_insert_integrity ON public.orders;
CREATE TRIGGER trg_orders_insert_integrity
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_insert_integrity();

-- 2. Order update integrity: non-admins may only move delivery progress forward
CREATE OR REPLACE FUNCTION public.enforce_order_update_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.total_amount := OLD.total_amount;
    NEW.items_total := OLD.items_total;
    NEW.payment_status := OLD.payment_status;
    NEW.payment_method := OLD.payment_method;
    NEW.branch_id := OLD.branch_id;
    NEW.rider_id := OLD.rider_id;
    NEW.delivery_address := OLD.delivery_address;
    NEW.delivery_latitude := OLD.delivery_latitude;
    NEW.delivery_longitude := OLD.delivery_longitude;
    NEW.delivery_instructions := OLD.delivery_instructions;
    NEW.notes := OLD.notes;
    NEW.order_type := OLD.order_type;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_update_integrity ON public.orders;
CREATE TRIGGER trg_orders_update_integrity
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_update_integrity();

-- 3. Order item pricing is taken from the catalogue, never from the client
CREATE OR REPLACE FUNCTION public.enforce_order_item_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  catalog_price numeric;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity < 1 OR NEW.quantity > 100 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.menu_item_id IS NOT NULL THEN
    SELECT price INTO catalog_price FROM public.menu_items WHERE id = NEW.menu_item_id;
  END IF;
  IF catalog_price IS NULL THEN
    SELECT price INTO catalog_price FROM public.menu_items WHERE name = NEW.item_name LIMIT 1;
  END IF;
  IF catalog_price IS NULL THEN
    SELECT price INTO catalog_price FROM public.grocery_items WHERE name = NEW.item_name LIMIT 1;
  END IF;
  IF catalog_price IS NULL THEN
    SELECT price INTO catalog_price FROM public.shop_items WHERE name = NEW.item_name LIMIT 1;
  END IF;
  IF catalog_price IS NULL THEN
    SELECT price INTO catalog_price FROM public.spirits_items WHERE name = NEW.item_name LIMIT 1;
  END IF;

  IF catalog_price IS NOT NULL THEN
    NEW.unit_price := catalog_price;
  END IF;

  IF NEW.unit_price IS NULL OR NEW.unit_price < 0 THEN
    RAISE EXCEPTION 'Invalid item price';
  END IF;

  NEW.subtotal := NEW.unit_price * NEW.quantity;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_pricing ON public.order_items;
CREATE TRIGGER trg_order_items_pricing
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_pricing();

-- 4. Recompute the order total from validated line items, allowing only a real promo discount
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid := COALESCE(NEW.order_id, OLD.order_id);
  v_items_total numeric := 0;
  v_gross numeric;
  v_claimed numeric;
  v_max_discount numeric := 0;
  v_current numeric;
  v_paid text;
  DELIVERY_FEE constant numeric := 20;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_items_total
  FROM public.order_items WHERE order_id = v_order_id;

  SELECT total_amount, payment_status INTO v_current, v_paid
  FROM public.orders WHERE id = v_order_id;

  IF v_current IS NULL OR v_paid = 'paid' THEN
    UPDATE public.orders SET items_total = v_items_total WHERE id = v_order_id;
    RETURN NULL;
  END IF;

  v_gross := v_items_total + DELIVERY_FEE;
  v_claimed := GREATEST(v_gross - v_current, 0);

  SELECT COALESCE(MAX(
    CASE WHEN discount_type = 'percentage'
      THEN v_gross * (discount_value / 100.0)
      ELSE discount_value
    END), 0)
  INTO v_max_discount
  FROM public.promo_codes
  WHERE is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses)
    AND min_order_amount <= v_gross;

  UPDATE public.orders
  SET items_total = v_items_total,
      total_amount = v_gross - LEAST(v_claimed, v_max_discount)
  WHERE id = v_order_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_recalc ON public.order_items;
CREATE TRIGGER trg_order_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

-- 5. Internal-only routines must not be callable through the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_loyalty() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_order_cancellation_finance() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_order_payment_confirmed() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_order_insert_integrity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_order_update_integrity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_order_item_pricing() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalculate_order_total() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_loyalty_points(uuid, integer, text, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.add_loyalty_points(uuid, integer, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_branch(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_branch(uuid) TO authenticated;