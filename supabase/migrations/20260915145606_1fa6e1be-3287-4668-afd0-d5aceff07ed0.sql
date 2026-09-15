ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.category_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL UNIQUE REFERENCES public.categories(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mpesa',
  account_name TEXT,
  paybill_number TEXT,
  till_number TEXT,
  account_number TEXT,
  bank_name TEXT,
  partner_name TEXT,
  payout_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_payment_settings TO authenticated;
GRANT ALL ON public.category_payment_settings TO service_role;
ALTER TABLE public.category_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage category payment settings"
ON public.category_payment_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_category_payment_settings_updated_at
BEFORE UPDATE ON public.category_payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  service_title TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  location TEXT,
  image_url TEXT,
  price_from NUMERIC,
  display_order INTEGER NOT NULL DEFAULT 99,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active service providers"
ON public.service_providers FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage service providers"
ON public.service_providers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_providers_category ON public.service_providers(category_id);

INSERT INTO public.categories (name, slug, description, icon, color, display_order, is_active, visibility, image_url)
SELECT 'Beauty & Lifestyle', 'beauty-lifestyle',
  'Cosmetics, skincare, grooming and lifestyle services delivered or booked on campus.',
  'sparkles', '#e05a8a', 5, true, 'all',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'beauty-lifestyle');