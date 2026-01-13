-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Create loyalty_transactions table for history
CREATE TABLE public.loyalty_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
    source TEXT NOT NULL CHECK (source IN ('order', 'review', 'referral', 'discount')),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_specials table
CREATE TABLE public.weekly_specials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id TEXT NOT NULL,
    menu_item_name TEXT NOT NULL,
    original_price INTEGER NOT NULL,
    discounted_price INTEGER NOT NULL,
    discount_percentage INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment_method column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending' CHECK (payment_method IN ('pending', 'mpesa', 'cash', 'card', 'mobile_money'));

-- Enable RLS on new tables
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_specials ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_points
CREATE POLICY "Users can view their own loyalty points" 
ON public.loyalty_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty points" 
ON public.loyalty_points 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty points" 
ON public.loyalty_points 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view their own loyalty transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty transactions" 
ON public.loyalty_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for weekly_specials (public read, admin write)
CREATE POLICY "Anyone can view weekly specials" 
ON public.weekly_specials 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage weekly specials" 
ON public.weekly_specials 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating loyalty_points.updated_at
CREATE TRIGGER update_loyalty_points_updated_at
BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize loyalty points for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.loyalty_points (user_id, points, total_earned, total_redeemed)
    VALUES (NEW.id, 0, 0, 0);
    RETURN NEW;
END;
$$;

-- Trigger to create loyalty points on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_loyalty ON auth.users;
CREATE TRIGGER on_auth_user_created_loyalty
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_loyalty();