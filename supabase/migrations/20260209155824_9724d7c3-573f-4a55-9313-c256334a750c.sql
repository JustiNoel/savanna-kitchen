-- Fix orders RLS: change from RESTRICTIVE to PERMISSIVE so regular users can create/view orders

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Riders can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Riders can update assigned orders" ON public.orders;

-- Recreate as PERMISSIVE
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Riders can view assigned orders" ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM riders WHERE riders.user_id = auth.uid() AND riders.id = orders.rider_id));
CREATE POLICY "Riders can update assigned orders" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM riders WHERE riders.user_id = auth.uid() AND riders.id = orders.rider_id));