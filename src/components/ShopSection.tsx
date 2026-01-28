import { useState } from 'react';
import { motion } from 'framer-motion';
import { useShopItems, shopCategories, ShopItem } from '@/hooks/useShopItems';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus, Store } from 'lucide-react';
import { toast } from 'sonner';

const ShopSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: shopItems, isLoading, error } = useShopItems();
  const { addToCart } = useCart();

  const filteredItems = shopItems?.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  const handleAddToCart = (item: ShopItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      category: 'shop',
    });
    toast.success(`${item.name} added to cart!`);
  };

  const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

  const getItemEmoji = (category: string, name: string): string => {
    const nameL = name.toLowerCase();
    if (nameL.includes('indomie') || nameL.includes('noodle')) return '🍜';
    if (nameL.includes('soap') && nameL.includes('bar')) return '🧼';
    if (nameL.includes('soap') || nameL.includes('wash')) return '🧴';
    if (nameL.includes('sanitary') || nameL.includes('pad')) return '🩹';
    if (nameL.includes('tissue')) return '🧻';
    if (nameL.includes('toilet') || nameL.includes('cleaner')) return '🚽';
    if (nameL.includes('toothpaste')) return '🪥';
    if (nameL.includes('detergent') || nameL.includes('laundry')) return '🧺';
    if (nameL.includes('oil')) return '🫒';
    
    switch (category) {
      case 'food': return '🍜';
      case 'toiletries': return '🧴';
      case 'sanitary': return '🩹';
      case 'household': return '🏠';
      default: return '📦';
    }
  };

  return (
    <section id="shop" className="py-20 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-primary font-medium mb-2">
              <Store className="h-4 w-4" />
              Grabby Shop
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Everyday <span className="text-primary">Essentials</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All your household needs in one place. From toiletries to food items - we've got you covered!
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {shopCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Shop Grid */}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 hover:border-primary/50">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="text-center mb-3">
                      {item.image_url ? (
                        <div className="w-full aspect-square mb-2 flex items-center justify-center bg-muted/50 rounded-lg overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-5xl">{getItemEmoji(item.category, item.name)}</div>
                        </div>
                      ) : (
                        <div className="w-full aspect-square mb-2 flex items-center justify-center bg-muted/50 rounded-lg">
                          <span className="text-5xl transition-transform duration-300 group-hover:scale-125">
                            {getItemEmoji(item.category, item.name)}
                          </span>
                        </div>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      {item.brand && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.brand}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full transition-transform group-hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-muted-foreground">No products found matching your search.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopSection;
