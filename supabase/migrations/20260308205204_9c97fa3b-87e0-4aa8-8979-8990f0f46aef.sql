
-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
FOR SELECT USING (is_active = true);

-- Create order_ratings table
CREATE TABLE public.order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  food_rating integer NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
  delivery_rating integer NOT NULL CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  comment text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own ratings" ON public.order_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ratings" ON public.order_ratings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings" ON public.order_ratings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Enable realtime on order_ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_ratings;
