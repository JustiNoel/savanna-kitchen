ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_reference_unique
  ON public.orders (upper(payment_reference))
  WHERE payment_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_order_insert_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.payment_status := 'pending';
    IF NEW.total_amount IS NULL OR NEW.total_amount < 0 THEN
      RAISE EXCEPTION 'Invalid order amount';
    END IF;

    IF COALESCE(NEW.payment_method, 'mpesa') = 'mpesa' THEN
      NEW.payment_reference := upper(trim(COALESCE(NEW.payment_reference, '')));
      IF NEW.payment_reference !~ '^[A-Z0-9]{8,15}$' THEN
        RAISE EXCEPTION 'A valid M-Pesa confirmation code is required';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_order_update_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.total_amount := OLD.total_amount;
    NEW.items_total := OLD.items_total;
    NEW.payment_status := OLD.payment_status;
    NEW.payment_method := OLD.payment_method;
    NEW.payment_reference := OLD.payment_reference;
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
$function$;

REVOKE EXECUTE ON FUNCTION public.enforce_order_insert_integrity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_order_update_integrity() FROM anon, authenticated, public;

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);