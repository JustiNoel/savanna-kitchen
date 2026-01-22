-- Fix RLS policies to be PERMISSIVE for grocery_items
DROP POLICY IF EXISTS "Anyone can view available grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Admins can manage grocery items" ON public.grocery_items;

CREATE POLICY "Anyone can view available grocery items" 
ON public.grocery_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage grocery items" 
ON public.grocery_items 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for shop_items
DROP POLICY IF EXISTS "Anyone can view available shop items" ON public.shop_items;
DROP POLICY IF EXISTS "Admins can manage shop items" ON public.shop_items;

CREATE POLICY "Anyone can view available shop items" 
ON public.shop_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage shop items" 
ON public.shop_items 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for spirits_items
DROP POLICY IF EXISTS "Anyone can view available spirits items" ON public.spirits_items;
DROP POLICY IF EXISTS "Admins can manage spirits items" ON public.spirits_items;

CREATE POLICY "Anyone can view available spirits items" 
ON public.spirits_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage spirits items" 
ON public.spirits_items 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for menu_items
DROP POLICY IF EXISTS "Anyone can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can view all menu items" ON public.menu_items;

CREATE POLICY "Anyone can view available menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage menu items" 
ON public.menu_items 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));