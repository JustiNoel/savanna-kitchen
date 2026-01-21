-- Create spirits_items table for Grabby Spirits
CREATE TABLE public.spirits_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL DEFAULT 'beer',
    brand TEXT,
    volume TEXT,
    alcohol_percentage NUMERIC,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spirits_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available spirits items" 
ON public.spirits_items 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage spirits items" 
ON public.spirits_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert sample spirits data
INSERT INTO public.spirits_items (name, description, price, category, brand, volume, alcohol_percentage) VALUES
('Tusker Lager', 'Kenya''s most popular beer - refreshing and crisp', 250, 'beer', 'Tusker', '500ml', 4.2),
('White Cap Lager', 'Premium Kenyan lager with a smooth taste', 250, 'beer', 'White Cap', '500ml', 4.2),
('Pilsner Lager', 'Light and refreshing East African lager', 230, 'beer', 'Pilsner', '500ml', 4.0),
('Guinness Foreign Extra', 'Rich and bold stout with a distinctive flavor', 350, 'beer', 'Guinness', '500ml', 7.5),
('Smirnoff Ice', 'Refreshing vodka-based ready-to-drink beverage', 400, 'rtd', 'Smirnoff', '275ml', 4.5),
('Kenya Cane Spirit', 'Premium Kenyan sugarcane spirit', 1200, 'spirits', 'KWAL', '750ml', 40.0),
('Jameson Irish Whiskey', 'Smooth triple-distilled Irish whiskey', 3500, 'whiskey', 'Jameson', '750ml', 40.0),
('Jack Daniels', 'Tennessee whiskey with a distinctive character', 4000, 'whiskey', 'Jack Daniels', '750ml', 40.0),
('Johnnie Walker Red Label', 'Classic blended Scotch whisky', 3000, 'whiskey', 'Johnnie Walker', '750ml', 40.0),
('Absolut Vodka', 'Swedish premium vodka', 2800, 'vodka', 'Absolut', '750ml', 40.0),
('Hennessy VS', 'Cognac with a bold and balanced flavor', 6500, 'cognac', 'Hennessy', '750ml', 40.0),
('Four Cousins Sweet Red', 'South African sweet red wine', 1500, 'wine', 'Four Cousins', '750ml', 10.0),
('4th Street Sweet Rose', 'Sweet and fruity rose wine', 800, 'wine', '4th Street', '750ml', 8.0),
('Captain Morgan Spiced Gold', 'Caribbean rum with vanilla and spice', 2500, 'rum', 'Captain Morgan', '750ml', 35.0),
('Baileys Irish Cream', 'Irish cream liqueur with chocolate notes', 3200, 'liqueur', 'Baileys', '750ml', 17.0);