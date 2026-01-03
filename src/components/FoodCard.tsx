import { useState } from 'react';
import { Plus, Flame, Leaf, Play } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getImageForDish } from '@/lib/foodImages';

export interface FoodCardItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  ingredients: string[];
  image_url?: string | null;
  is_popular?: boolean | null;
  is_vegetarian?: boolean | null;
  spice_level?: number | null;
}

interface FoodCardProps {
  item: FoodCardItem;
}

const FoodCard = ({ item }: FoodCardProps) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || '',
      category: item.category,
      ingredients: item.ingredients,
    });
    toast.success(`${item.name} added to cart!`, {
      description: `KSh ${item.price.toLocaleString()}`,
    });
  };

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const getSpiceIndicator = (level?: number | null) => {
    if (!level) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(level)].map((_, i) => (
          <Flame key={i} className="h-3 w-3 text-primary fill-primary" />
        ))}
      </div>
    );
  };

  // Get image from either database URL or local assets
  const imageUrl = item.image_url || getImageForDish(item.name);

  return (
    <div 
      className="group bg-card rounded-2xl overflow-hidden border border-border card-hover relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={item.name}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isHovered ? 'scale-110 brightness-110' : 'scale-100'
              }`}
            />
            {/* Cinematic serving overlay on hover */}
            <div className={`absolute inset-0 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* Steam/smoke effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 animate-pulse" />
              
              {/* Radial glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-transparent to-transparent" />
              
              {/* Golden shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-orange-500/10" />
              
              {/* Serving indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 animate-pulse shadow-lg ring-2 ring-primary/50">
                  <Play className="h-6 w-6 text-primary fill-primary" />
                </div>
              </div>
              
              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                <p className="text-sm font-medium text-primary animate-fade-in">
                  ✨ Freshly prepared for you
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-6xl transition-transform duration-300 ${
              isHovered ? 'scale-125 animate-bounce' : ''
            }`}>
              🍽️
            </span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          {item.is_popular && (
            <Badge variant="default" className="bg-accent text-accent-foreground">
              Popular
            </Badge>
          )}
          {item.is_vegetarian && (
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              <Leaf className="h-3 w-3 mr-1" />
              Veg
            </Badge>
          )}
        </div>

        {/* Quick Add Button */}
        <Button
          size="icon"
          className={`absolute bottom-3 right-3 transition-all duration-300 h-10 w-10 rounded-full shadow-lg ${
            isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-90'
          }`}
          onClick={handleAddToCart}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold leading-tight">{item.name}</h3>
          {getSpiceIndicator(item.spice_level)}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Ingredients */}
        <div className="flex flex-wrap gap-1 mb-4">
          {item.ingredients.slice(0, 3).map((ingredient, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
            >
              {ingredient}
            </span>
          ))}
          {item.ingredients.length > 3 && (
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              +{item.ingredients.length - 3}
            </span>
          )}
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-bold text-primary">
            {formatPrice(item.price)}
          </p>
          <Button size="sm" variant="outline" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
