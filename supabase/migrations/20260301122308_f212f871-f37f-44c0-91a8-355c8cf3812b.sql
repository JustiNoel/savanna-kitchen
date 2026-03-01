
-- Allow admins to view all loyalty points
CREATE POLICY "Admins can view all loyalty points" ON public.loyalty_points AS PERMISSIVE
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to view all loyalty transactions
CREATE POLICY "Admins can view all loyalty transactions" ON public.loyalty_transactions AS PERMISSIVE
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
