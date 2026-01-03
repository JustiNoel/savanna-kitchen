import { useState, useEffect } from 'react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { menuItems as fallbackMenuItems, categories } from '@/data/menuData';
import FoodCard, { FoodCardItem } from './FoodCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

const MenuSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: dbMenuItems, isLoading, error } = useMenuItems();

  // Use database items if available, otherwise fallback to static data
  const menuItems: FoodCardItem[] = dbMenuItems && dbMenuItems.length > 0 
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

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="menu" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-medium mb-2">Our Menu</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Authentic Kenyan <span className="text-primary">Dishes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our selection of traditional Kenyan and African cuisine, prepared with fresh ingredients and authentic recipes passed down through generations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
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

        {/* Menu Grid */}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-muted-foreground">No dishes found matching your search.</p>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <div className="text-center mt-8 text-muted-foreground">
            Showing {filteredItems.length} of {menuItems.length} dishes
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
