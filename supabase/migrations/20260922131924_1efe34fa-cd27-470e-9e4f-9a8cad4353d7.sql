-- reviews: add moderation flag and scope public reads to published rows
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Published reviews are viewable"
ON public.reviews
FOR SELECT
USING (
  is_published = true
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- app_settings: only the single global settings row is readable
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Global app settings row is readable"
ON public.app_settings
FOR SELECT
USING (id = 1);

-- weekly_specials: only currently running, active specials are public
DROP POLICY IF EXISTS "Anyone can view weekly specials" ON public.weekly_specials;
CREATE POLICY "Active running specials are viewable"
ON public.weekly_specials
FOR SELECT
USING (
  (is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date)
  OR public.has_role(auth.uid(), 'admin')
);

-- category_branch_visibility: only mappings for active branches and active categories
DROP POLICY IF EXISTS "Anyone can view category visibility" ON public.category_branch_visibility;
CREATE POLICY "Active branch category visibility is viewable"
ON public.category_branch_visibility
FOR SELECT
USING (
  (
    EXISTS (SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.status = 'active')
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.is_active = true)
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- menu_item_branch_visibility: only mappings for active branches
DROP POLICY IF EXISTS "Anyone can view item visibility" ON public.menu_item_branch_visibility;
CREATE POLICY "Active branch item visibility is viewable"
ON public.menu_item_branch_visibility
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.status = 'active')
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_branch_manager_of(auth.uid(), branch_id)
);

-- branch_menu_overrides: only overrides for active branches
DROP POLICY IF EXISTS "Anyone can view overrides" ON public.branch_menu_overrides;
CREATE POLICY "Active branch overrides are viewable"
ON public.branch_menu_overrides
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.status = 'active')
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_branch_manager_of(auth.uid(), branch_id)
);