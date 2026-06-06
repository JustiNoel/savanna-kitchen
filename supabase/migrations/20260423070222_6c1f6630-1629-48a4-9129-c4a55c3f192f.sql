
-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'package',
  color TEXT NOT NULL DEFAULT '#f97316',
  display_order INTEGER NOT NULL DEFAULT 99,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'specific')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Category branch visibility
CREATE TABLE IF NOT EXISTS public.category_branch_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (category_id, branch_id)
);

ALTER TABLE public.category_branch_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category visibility"
ON public.category_branch_visibility FOR SELECT USING (true);

CREATE POLICY "Admins manage category visibility"
ON public.category_branch_visibility FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS branch_visibility TEXT NOT NULL DEFAULT 'all' CHECK (branch_visibility IN ('all', 'specific'));

-- Menu item branch visibility
CREATE TABLE IF NOT EXISTS public.menu_item_branch_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, branch_id)
);

ALTER TABLE public.menu_item_branch_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item visibility"
ON public.menu_item_branch_visibility FOR SELECT USING (true);

CREATE POLICY "Admins manage item visibility"
ON public.menu_item_branch_visibility FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Branch managers manage own item visibility"
ON public.menu_item_branch_visibility FOR ALL
USING (public.is_branch_manager_of(auth.uid(), branch_id))
WITH CHECK (public.is_branch_manager_of(auth.uid(), branch_id));

-- Allow branch managers to insert/update menu items in their branch
CREATE POLICY "Branch managers manage own menu items"
ON public.menu_items FOR ALL
USING (branch_id IS NOT NULL AND public.is_branch_manager_of(auth.uid(), branch_id))
WITH CHECK (branch_id IS NOT NULL AND public.is_branch_manager_of(auth.uid(), branch_id));

-- Seed protected default categories
INSERT INTO public.categories (name, slug, icon, color, display_order, is_protected, description)
VALUES
  ('Food', 'food', 'utensils', '#ef4444', 1, true, 'Authentic African cuisine and chef specials'),
  ('Wines', 'wines', 'wine', '#7c3aed', 2, true, 'Premium spirits, wines and beverages'),
  ('Shop', 'shop', 'shopping-bag', '#0ea5e9', 3, true, 'Household essentials and lifestyle products'),
  ('Grocery', 'grocery', 'shopping-cart', '#22c55e', 4, true, 'Fresh produce and daily groceries')
ON CONFLICT (slug) DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
