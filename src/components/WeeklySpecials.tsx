import { useState, useEffect } from 'react';
import { Timer, Percent, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getImageForDish } from '@/lib/foodImages';
import { toast } from 'sonner';

interface WeeklySpecial {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  start_date: string;
  end_date: string;
}

const WeeklySpecials = () => {
  const [specials, setSpecials] = useState<WeeklySpecial[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchSpecials();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (specials.length > 0) {
        const endDate = new Date(specials[0].end_date);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft('Expired');
        }
      }
    }, 60000);

    // Initial calculation
    if (specials.length > 0) {
      const endDate = new Date(specials[0].end_date);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }

    return () => clearInterval(timer);
  }, [specials]);

  const fetchSpecials = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('weekly_specials')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(4);

    if (!error && data) {
      setSpecials(data);
    }
  };

  const handleAddToCart = (special: WeeklySpecial) => {
    addToCart({
      id: special.menu_item_id,
      name: special.menu_item_name,
      price: special.discounted_price,
      description: `Weekly Special - ${special.discount_percentage}% off!`,
    });
    toast.success(`${special.menu_item_name} added to cart with ${special.discount_percentage}% discount!`);
  };

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  if (specials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <Badge variant="secondary" className="mb-3">
              <Percent className="h-3 w-3 mr-1" />
              Limited Time Offers
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Weekly <span className="text-primary">Specials</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Don't miss out on these delicious deals!
            </p>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-lg border border-destructive/20">
              <Timer className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Ends in: {timeLeft}</span>
            </div>
          )}
        </div>

        {/* Specials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specials.map((special) => {
            const imageUrl = getImageForDish(special.menu_item_name);
            return (
              <div
                key={special.id}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative aspect-video">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={special.menu_item_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                    -{special.discount_percentage}%
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold mb-2 truncate">
                    {special.menu_item_name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(special.discounted_price)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(special.original_price)}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(special)}
                    className="w-full"
                    size="sm"
                  >
                    Add to Cart
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WeeklySpecials;
