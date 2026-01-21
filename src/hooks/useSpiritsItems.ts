import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpiritsItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  brand: string | null;
  volume: string | null;
  alcohol_percentage: number | null;
  image_url: string | null;
  is_available: boolean | null;
  stock_quantity: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const spiritsCategories = [
  { id: 'all', name: 'All Drinks', icon: '🍹' },
  { id: 'beer', name: 'Beer', icon: '🍺' },
  { id: 'whiskey', name: 'Whiskey', icon: '🥃' },
  { id: 'vodka', name: 'Vodka', icon: '🍸' },
  { id: 'wine', name: 'Wine', icon: '🍷' },
  { id: 'spirits', name: 'Spirits', icon: '🥃' },
  { id: 'rum', name: 'Rum', icon: '🍹' },
  { id: 'cognac', name: 'Cognac', icon: '🥃' },
  { id: 'liqueur', name: 'Liqueur', icon: '🍸' },
  { id: 'rtd', name: 'RTD', icon: '🍹' },
];

export const useSpiritsItems = () => {
  return useQuery({
    queryKey: ['spirits-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spirits_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as SpiritsItem[];
    },
  });
};
