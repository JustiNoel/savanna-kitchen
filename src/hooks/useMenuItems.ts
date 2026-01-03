import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  ingredients: string[];
  image_url: string | null;
  is_popular: boolean | null;
  is_vegetarian: boolean | null;
  spice_level: number | null;
  is_available: boolean | null;
}

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });
};

export const categories = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'mains', name: 'Main Dishes', icon: '🥘' },
  { id: 'sides', name: 'Sides', icon: '🥗' },
  { id: 'snacks', name: 'Snacks', icon: '🥟' },
  { id: 'beverages', name: 'Beverages', icon: '☕' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
];
