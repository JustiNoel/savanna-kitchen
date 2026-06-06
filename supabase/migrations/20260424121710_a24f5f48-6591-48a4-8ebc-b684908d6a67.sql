-- ===== FOREIGN KEYS (defensive — only add if not present) =====
DO $$
BEGIN
  -- order_items -> orders (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey') THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;

  -- orders -> branches (set null)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_branch_id_fkey') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  -- profiles -> branches (set null)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_branch_id_fkey') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  -- branch_managers -> branches (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_managers_branch_id_fkey') THEN
    ALTER TABLE public.branch_managers
      ADD CONSTRAINT branch_managers_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  -- menu_items -> branches (set null) and -> categories (set null)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_branch_id_fkey') THEN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_category_id_fkey') THEN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- visibility / overrides cascade with parent
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_branch_vis_branch_fkey') THEN
    ALTER TABLE public.category_branch_visibility
      ADD CONSTRAINT category_branch_vis_branch_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_branch_vis_category_fkey') THEN
    ALTER TABLE public.category_branch_visibility
      ADD CONSTRAINT category_branch_vis_category_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_branch_vis_branch_fkey') THEN
    ALTER TABLE public.menu_item_branch_visibility
      ADD CONSTRAINT menu_item_branch_vis_branch_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_branch_vis_item_fkey') THEN
    ALTER TABLE public.menu_item_branch_visibility
      ADD CONSTRAINT menu_item_branch_vis_item_fkey
      FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_menu_overrides_branch_fkey') THEN
    ALTER TABLE public.branch_menu_overrides
      ADD CONSTRAINT branch_menu_overrides_branch_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  -- order ratings -> orders (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_ratings_order_id_fkey') THEN
    ALTER TABLE public.order_ratings
      ADD CONSTRAINT order_ratings_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;

  -- survey_answers -> survey_responses & survey_questions (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_response_fkey') THEN
    ALTER TABLE public.survey_answers
      ADD CONSTRAINT survey_answers_response_fkey
      FOREIGN KEY (survey_response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_question_fkey') THEN
    ALTER TABLE public.survey_answers
      ADD CONSTRAINT survey_answers_question_fkey
      FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;
  END IF;
END$$;

-- ===== APP_SETTINGS (single-row config) =====
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT NOT NULL DEFAULT 'Our ordering system is currently under maintenance. Updates are ongoing — please check back later. Thank you for your patience! 🛠️',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (id, maintenance_mode)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Realtime so admins flipping the toggle is reflected instantly for users
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;