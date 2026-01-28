import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGroceryItems, groceryCategories, GroceryItem } from '@/hooks/useGroceryItems';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, Plus, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const GrocerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: groceryItems, isLoading, error } = useGroceryItems();
  const { addToCart } = useCart();

  const filteredItems = groceryItems?.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  const handleAddToCart = (item: GroceryItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      category: 'grocery',
    });
    toast.success(`${item.name} added to cart!`);
  };

  const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

  const getItemEmoji = (category: string, name: string): string => {
    const nameL = name.toLowerCase();
    if (nameL.includes('tomato')) return '🍅';
    if (nameL.includes('onion')) return '🧅';
    if (nameL.includes('kale') || nameL.includes('sukuma')) return '🥬';
    if (nameL.includes('spinach')) return '🥬';
    if (nameL.includes('carrot')) return '🥕';
    if (nameL.includes('cabbage')) return '🥬';
    if (nameL.includes('pepper')) return '🫑';
    if (nameL.includes('potato')) return '🥔';
    if (nameL.includes('banana')) return '🍌';
    if (nameL.includes('mango')) return '🥭';
    if (nameL.includes('orange')) return '🍊';
    if (nameL.includes('pineapple')) return '🍍';
    if (nameL.includes('avocado')) return '🥑';
    if (nameL.includes('watermelon')) return '🍉';
    if (nameL.includes('passion')) return '💜';
    if (nameL.includes('pawpaw') || nameL.includes('papaya')) return '🍈';
    return category === 'vegetables' ? '🥬' : '🍎';
  };

  return (
    <section id="groceries" className="py-20 bg-gradient-to-b from-secondary/30 to-background">
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
              <Leaf className="h-4 w-4" />
              Grabby Groceries
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Fresh <span className="text-primary">Vegetables & Fruits</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Farm-fresh vegetables and fruits delivered straight to your doorstep. Always fresh, always quality.
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {groceryCategories.map((category) => (
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

        {/* Grocery Grid */}
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
                      <p className="text-xs text-muted-foreground mt-1">{item.unit && `per ${item.unit}`}</p>
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
            <p className="text-muted-foreground">No groceries found matching your search.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GrocerySection;
