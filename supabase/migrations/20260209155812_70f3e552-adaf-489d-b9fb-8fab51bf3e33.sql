-- Fix order_items RLS: change user policies from RESTRICTIVE to PERMISSIVE
-- The current RESTRICTIVE policies require ALL to pass, which blocks regular users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- Recreate as PERMISSIVE (any one can pass)
CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage order items" 
ON public.order_items 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));