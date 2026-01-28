import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpiritsItems, spiritsCategories, SpiritsItem } from '@/hooks/useSpiritsItems';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus, Wine } from 'lucide-react';
import { toast } from 'sonner';

const SpiritsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: spiritsItems, isLoading } = useSpiritsItems();
  const { addToCart } = useCart();

  const filteredItems = spiritsItems?.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  const handleAddToCart = (item: SpiritsItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      category: 'spirits',
    });
    toast.success(`${item.name} added to cart!`);
  };

  const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

  const getItemEmoji = (category: string): string => {
    switch (category) {
      case 'beer': return '🍺';
      case 'whiskey': return '🥃';
      case 'vodka': return '🍸';
      case 'wine': return '🍷';
      case 'spirits': return '🥃';
      case 'rum': return '🍹';
      case 'cognac': return '🥃';
      case 'liqueur': return '🍸';
      case 'rtd': return '🍹';
      default: return '🍾';
    }
  };

  return (
    <section id="spirits" className="py-20 bg-gradient-to-b from-muted/50 to-background">
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
              <Wine className="h-4 w-4" />
              Grabby Spirits
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Premium <span className="text-primary">Drinks & Spirits</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From local favorites to international brands - enjoy responsibly! 🍻
            </p>
          </motion.div>
        </div>

        {/* Age Verification Notice */}
        <div className="max-w-md mx-auto mb-8 p-4 bg-primary/10 rounded-lg text-center">
          <p className="text-sm text-primary">
            🔞 You must be 18+ years old to purchase alcoholic beverages. Drink responsibly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {spiritsCategories.map((category) => (
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

        {/* Spirits Grid */}
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
                        <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-muted/50">
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<span class="text-5xl flex items-center justify-center h-full">${getItemEmoji(item.category)}</span>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square mb-2 flex items-center justify-center bg-muted/50 rounded-lg">
                          <span className="text-5xl transition-transform duration-300 group-hover:scale-125">
                            {getItemEmoji(item.category)}
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
                      {item.volume && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.volume} • {item.alcohol_percentage}% ABV
                        </p>
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
            <p className="text-muted-foreground">No drinks found matching your search.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpiritsSection;
