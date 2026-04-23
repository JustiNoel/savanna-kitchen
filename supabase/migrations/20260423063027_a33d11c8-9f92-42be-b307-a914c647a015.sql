-- 1. Add branch_manager to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';

-- 2. Branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active branches" ON public.branches;
CREATE POLICY "Anyone can view active branches"
  ON public.branches FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage branches" ON public.branches;
CREATE POLICY "Admins manage branches"
  ON public.branches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_branches_updated ON public.branches;
CREATE TRIGGER trg_branches_updated
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add branch_id to profiles FIRST (before functions reference it)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 4. Branch managers join table
CREATE TABLE IF NOT EXISTS public.branch_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (branch_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS branch_managers_one_active_per_branch
  ON public.branch_managers (branch_id) WHERE is_active = true;

ALTER TABLE public.branch_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage branch managers" ON public.branch_managers;
CREATE POLICY "Admins manage branch managers"
  ON public.branch_managers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Managers view own assignment" ON public.branch_managers;
CREATE POLICY "Managers view own assignment"
  ON public.branch_managers FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_branch(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_branch_manager_of(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branch_managers
    WHERE user_id = _user_id AND branch_id = _branch_id AND is_active = true
  )
$$;

-- 6. Allow branch managers to view profiles in their branch
DROP POLICY IF EXISTS "Branch managers view branch customers" ON public.profiles;
CREATE POLICY "Branch managers view branch customers"
  ON public.profiles FOR SELECT
  USING (
    branch_id IS NOT NULL
    AND public.is_branch_manager_of(auth.uid(), branch_id)
  );

-- 7. Add branch_id to items + orders
ALTER TABLE public.menu_items     ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.grocery_items  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.shop_items     ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.spirits_items  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.orders         ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_branch ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch ON public.menu_items(branch_id);

-- Branch managers view & update orders in their branch
DROP POLICY IF EXISTS "Branch managers view branch orders" ON public.orders;
CREATE POLICY "Branch managers view branch orders"
  ON public.orders FOR SELECT
  USING (branch_id IS NOT NULL AND public.is_branch_manager_of(auth.uid(), branch_id));

DROP POLICY IF EXISTS "Branch managers update branch orders" ON public.orders;
CREATE POLICY "Branch managers update branch orders"
  ON public.orders FOR UPDATE
  USING (branch_id IS NOT NULL AND public.is_branch_manager_of(auth.uid(), branch_id));

DROP POLICY IF EXISTS "Branch managers view branch order items" ON public.order_items;
CREATE POLICY "Branch managers view branch order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id IS NOT NULL
      AND public.is_branch_manager_of(auth.uid(), o.branch_id)
  ));

-- 8. Branch menu overrides
CREATE TABLE IF NOT EXISTS public.branch_menu_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  item_table TEXT NOT NULL CHECK (item_table IN ('menu_items','grocery_items','shop_items','spirits_items')),
  item_id UUID NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  custom_price NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, item_table, item_id)
);

ALTER TABLE public.branch_menu_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view overrides" ON public.branch_menu_overrides;
CREATE POLICY "Anyone can view overrides"
  ON public.branch_menu_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage all overrides" ON public.branch_menu_overrides;
CREATE POLICY "Admins manage all overrides"
  ON public.branch_menu_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Branch managers manage own overrides" ON public.branch_menu_overrides;
CREATE POLICY "Branch managers manage own overrides"
  ON public.branch_menu_overrides FOR ALL
  USING (public.is_branch_manager_of(auth.uid(), branch_id))
  WITH CHECK (public.is_branch_manager_of(auth.uid(), branch_id));

DROP TRIGGER IF EXISTS trg_overrides_updated ON public.branch_menu_overrides;
CREATE TRIGGER trg_overrides_updated
  BEFORE UPDATE ON public.branch_menu_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update handle_new_user to accept branch_id from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _branch UUID;
BEGIN
  BEGIN
    _branch := NULLIF(NEW.raw_user_meta_data ->> 'branch_id', '')::UUID;
  EXCEPTION WHEN others THEN
    _branch := NULL;
  END;

  INSERT INTO public.profiles (user_id, full_name, email, branch_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email, _branch);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- 10. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.branch_managers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.branch_menu_overrides;