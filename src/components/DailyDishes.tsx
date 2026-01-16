import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, ChefHat } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { menuItems as fallbackMenuItems } from '@/data/menuData';
import FoodCard, { FoodCardItem } from './FoodCard';

const DailyDishes = () => {
  const { data: dbMenuItems, isLoading } = useMenuItems();

  // Get today's date as a seed for consistent daily rotation
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const menuItems: FoodCardItem[] = useMemo(() => {
    const items = dbMenuItems && dbMenuItems.length > 0
      ? dbMenuItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          ingredients: item.ingredients || [],
          image_url: item.image_url,
          is_popular: item.is_popular,
          is_vegetarian: item.is_vegetarian,
          spice_level: item.spice_level,
        }))
      : fallbackMenuItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          ingredients: item.ingredients,
          is_popular: item.isPopular,
          is_vegetarian: item.isVegetarian,
          spice_level: item.spiceLevel,
        }));
    return items;
  }, [dbMenuItems]);

  // Rotate dishes based on day of year
  const dailyDishes = useMemo(() => {
    if (menuItems.length === 0) return [];
    
    // Create a deterministic shuffle based on the day
    const shuffled = [...menuItems].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) + dayOfYear) % menuItems.length;
      const hashB = (b.id.charCodeAt(0) + dayOfYear) % menuItems.length;
      return hashA - hashB;
    });
    
    // Return 4 dishes for today's special
    return shuffled.slice(0, 4);
  }, [menuItems, dayOfYear]);

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today.getDay()];
  };

  if (isLoading || dailyDishes.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Flame className="h-4 w-4" />
            <span className="font-medium text-sm">{getDayName()}'s Picks</span>
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Today's <span className="text-primary">Featured Dishes</span>
          </h2>
          
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our chef's handpicked selection for today. Fresh, flavorful, and waiting for you!
          </p>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Available today only</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary" />
              <span>Chef's recommendation</span>
            </div>
          </div>
        </motion.div>

        {/* Daily Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dailyDishes.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative">
                <div className="absolute -top-3 -right-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  #{index + 1} Today
                </div>
                <FoodCard item={item} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyDishes;
