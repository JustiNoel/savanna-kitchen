import { Plus, Flame, Leaf } from 'lucide-react';
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
    <div className="group bg-card rounded-2xl overflow-hidden border border-border card-hover">
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">
              🍽️
            </span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-10 w-10 rounded-full shadow-lg"
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
