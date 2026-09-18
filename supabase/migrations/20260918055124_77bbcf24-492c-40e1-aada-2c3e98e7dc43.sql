CREATE OR REPLACE FUNCTION public.handle_order_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_transactions
      WHERE order_id = NEW.id AND type = 'income'
    ) THEN
      INSERT INTO public.financial_transactions
        (order_id, type, category, amount, description, payment_method, reference_number)
      VALUES
        (NEW.id, 'income', 'order_payment', NEW.total_amount,
         'Confirmed payment for order #' || substring(NEW.id::text, 1, 8),
         COALESCE(NEW.payment_method, 'mpesa'), NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_payment_confirmed ON public.orders;
CREATE TRIGGER trg_order_payment_confirmed
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_payment_confirmed();