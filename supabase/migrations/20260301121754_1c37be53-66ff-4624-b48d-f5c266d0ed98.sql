
-- Fix order_items: Make all policies explicitly PERMISSIVE so ANY one can grant access
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

CREATE POLICY "Users can view own order items" ON public.order_items AS PERMISSIVE
FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can create order items" ON public.order_items AS PERMISSIVE
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Admins can view all order items" ON public.order_items AS PERMISSIVE
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage order items" ON public.order_items AS PERMISSIVE
FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix orders: Make all policies explicitly PERMISSIVE
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Riders can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Riders can update assigned orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders AS PERMISSIVE FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage orders" ON public.orders AS PERMISSIVE FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Riders can view assigned orders" ON public.orders AS PERMISSIVE FOR SELECT USING (EXISTS (SELECT 1 FROM riders WHERE riders.user_id = auth.uid() AND riders.id = orders.rider_id));
CREATE POLICY "Riders can update assigned orders" ON public.orders AS PERMISSIVE FOR UPDATE USING (EXISTS (SELECT 1 FROM riders WHERE riders.user_id = auth.uid() AND riders.id = orders.rider_id));

-- Fix financial_transactions: Allow webhook inserts AND admin management
DROP POLICY IF EXISTS "Admins can manage financial transactions" ON public.financial_transactions;

CREATE POLICY "Admins can manage financial transactions" ON public.financial_transactions AS PERMISSIVE
FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix other admin-only tables that may have same issue
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices AS PERMISSIVE
FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can manage expenses" ON public.expenses AS PERMISSIVE
FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
