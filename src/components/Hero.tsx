import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import kitchenVideo from '@/assets/kitchen-background.mp4';
import categoryFood from '@/assets/category-food.jpg';
import categoryGrocery from '@/assets/category-grocery.jpg';
import categoryShop from '@/assets/category-shop.jpg';
import categorySpirits from '@/assets/category-spirits.jpg';

interface CategoryCard {
  id: string;
  name: string;
  image: string;
  emoji: string;
  description: string;
  href: string;
  color: string;
  bgGradient: string;
}

const categories: CategoryCard[] = [
  {
    id: 'food',
    name: 'Food',
    image: categoryFood,
    emoji: '🍽️',
    description: 'Delicious meals & Book your table',
    href: '/food',
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/10',
  },
  {
    id: 'grocery',
    name: 'Grocery',
    image: categoryGrocery,
    emoji: '🥕',
    description: 'Fresh vegetables & fruits',
    href: '/grocery',
    color: 'text-green-500',
    bgGradient: 'from-green-500/20 to-emerald-500/10',
  },
  {
    id: 'shop',
    name: 'Shop',
    image: categoryShop,
    emoji: '🛒',
    description: 'Everyday essentials',
    href: '/shop',
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-violet-500/10',
  },
  {
    id: 'spirits',
    name: 'Spirits',
    image: categorySpirits,
    emoji: '🍾',
    description: 'Premium drinks & spirits',
    href: '/spirits',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
  },
];

const Hero = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleAdminAdd = () => {
    navigate('/admin');
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={kitchenVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/20" />
      </div>

      {/* Decorative Elements */}
      <motion.div 
        className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-10"
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-32 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl z-10"
        animate={{ y: [0, 20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-20 container mx-auto px-4">
        {/* Logo & Tagline */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <img 
              src="/grabbys-logo.jpeg" 
              alt="Grabbys" 
              className="h-24 w-24 md:h-32 md:w-32 mx-auto rounded-2xl shadow-2xl object-contain"
            />
          </motion.div>
          
          <motion.h1 
            className="font-display text-5xl md:text-7xl font-bold mb-4 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Taste the{' '}
            <span className="text-primary">Grabbys</span>
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Your one-stop destination for food, groceries, essentials & spirits 🇰🇪
          </motion.p>
        </div>

        {/* Category Cards Grid */}
        <motion.div 
          data-tour="hero-categories"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={category.href} className="block h-full">
                <Card className={`h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl overflow-hidden bg-gradient-to-br ${category.bgGradient} backdrop-blur-sm`}>
                  <CardContent className="p-0 text-center">
                    <div className="relative w-full h-28 md:h-36 overflow-hidden rounded-t-lg">
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={512}
                        height={512}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg">{category.emoji}</span>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-display text-lg md:text-xl font-bold mb-1 text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Admin Add Button - Only visible to admins */}
        {isAdmin && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <Button
              onClick={handleAdminAdd}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add New Items (Admin)
            </Button>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div 
          data-tour="hero-stats"
          className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-12 backdrop-blur-sm bg-background/40 rounded-2xl p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <div className="text-center">
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">50+</p>
            <p className="text-xs text-muted-foreground">Dishes</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">24/7</p>
            <p className="text-xs text-muted-foreground">Delivery</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">5K+</p>
            <p className="text-xs text-muted-foreground">Happy Guests</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
