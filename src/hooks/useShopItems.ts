import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  brand: string | null;
  image_url: string | null;
  is_available: boolean | null;
  stock_quantity: number | null;
}

export const useShopItems = () => {
  return useQuery({
    queryKey: ['shop-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as ShopItem[];
    },
  });
};

export const shopCategories = [
  { id: 'all', name: 'All Items', icon: '🏪' },
  { id: 'food', name: 'Food Items', icon: '🍜' },
  { id: 'toiletries', name: 'Toiletries', icon: '🧴' },
  { id: 'sanitary', name: 'Sanitary', icon: '🧻' },
  { id: 'household', name: 'Household', icon: '🏠' },
];
