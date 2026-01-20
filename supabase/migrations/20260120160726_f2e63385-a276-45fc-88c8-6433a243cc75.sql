-- Add delivery location fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';

-- Add RLS policy for admins to update user_roles (add other admins)
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create grocery_items table
CREATE TABLE IF NOT EXISTS public.grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'vegetables',
    unit TEXT DEFAULT 'kg',
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shop_items table
CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'household',
    brand TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for grocery_items
CREATE POLICY "Anyone can view available grocery items" 
ON public.grocery_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage grocery items" 
ON public.grocery_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for shop_items
CREATE POLICY "Anyone can view available shop items" 
ON public.shop_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage shop items" 
ON public.shop_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_grocery_items_updated_at
BEFORE UPDATE ON public.grocery_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample grocery items (vegetables and fruits)
INSERT INTO public.grocery_items (name, description, price, category, unit, is_available) VALUES
('Fresh Tomatoes', 'Locally grown ripe tomatoes', 80, 'vegetables', 'kg', true),
('Onions', 'Fresh red onions', 60, 'vegetables', 'kg', true),
('Sukuma Wiki (Kale)', 'Fresh green kale leaves', 30, 'vegetables', 'bunch', true),
('Spinach', 'Tender baby spinach', 40, 'vegetables', 'bunch', true),
('Carrots', 'Fresh organic carrots', 70, 'vegetables', 'kg', true),
('Cabbage', 'Green cabbage head', 50, 'vegetables', 'piece', true),
('Bell Peppers', 'Mixed color bell peppers', 150, 'vegetables', 'kg', true),
('Potatoes', 'Irish potatoes', 80, 'vegetables', 'kg', true),
('Bananas', 'Sweet ripe bananas', 100, 'fruits', 'bunch', true),
('Mangoes', 'Sweet Ngowe mangoes', 120, 'fruits', 'kg', true),
('Oranges', 'Juicy navel oranges', 80, 'fruits', 'kg', true),
('Pineapples', 'Sweet MD2 pineapples', 150, 'fruits', 'piece', true),
('Avocados', 'Creamy Hass avocados', 100, 'fruits', 'kg', true),
('Watermelon', 'Fresh watermelon', 200, 'fruits', 'piece', true),
('Passion Fruits', 'Purple passion fruits', 200, 'fruits', 'kg', true),
('Pawpaw (Papaya)', 'Ripe pawpaw', 80, 'fruits', 'piece', true);

-- Insert sample shop items (sanitaries, soap, indomie, etc.)
INSERT INTO public.shop_items (name, description, price, category, brand, is_available) VALUES
('Indomie Noodles', 'Instant chicken flavor noodles', 50, 'food', 'Indomie', true),
('Indomie Noodles Pack', 'Pack of 5 instant noodles', 220, 'food', 'Indomie', true),
('Bar Soap', 'Antibacterial bath soap', 80, 'toiletries', 'Dettol', true),
('Liquid Soap', 'Hand wash liquid soap 500ml', 250, 'toiletries', 'Lifebuoy', true),
('Dish Soap', 'Dishwashing liquid 1L', 180, 'household', 'Fairy', true),
('Sanitary Pads (Regular)', 'Always sanitary pads 10 pack', 150, 'sanitary', 'Always', true),
('Sanitary Pads (Overnight)', 'Always overnight pads 8 pack', 180, 'sanitary', 'Always', true),
('Tissue Paper', 'Soft tissue rolls 4 pack', 200, 'household', 'Safi', true),
('Toilet Cleaner', 'Harpic toilet cleaner 500ml', 250, 'household', 'Harpic', true),
('Toothpaste', 'Colgate toothpaste 100ml', 150, 'toiletries', 'Colgate', true),
('Laundry Detergent', 'OMO washing powder 1kg', 350, 'household', 'OMO', true),
('Cooking Oil', 'Vegetable cooking oil 1L', 280, 'food', 'Golden Fry', true);