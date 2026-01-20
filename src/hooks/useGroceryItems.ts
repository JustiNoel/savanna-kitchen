import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GroceryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  unit: string | null;
  image_url: string | null;
  is_available: boolean | null;
  stock_quantity: number | null;
}

export const useGroceryItems = () => {
  return useQuery({
    queryKey: ['grocery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as GroceryItem[];
    },
  });
};

export const groceryCategories = [
  { id: 'all', name: 'All Items', icon: '🛒' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
];
