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
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
  { id: 'lunch', name: 'Lunch', icon: '☀️' },
  { id: 'dinner', name: 'Dinner', icon: '🌙' },
  { id: 'supper', name: 'Supper', icon: '🌃' },
  { id: 'mains', name: 'Main Dishes', icon: '🍖' },
  { id: 'sides', name: 'Sides', icon: '🥗' },
  { id: 'snacks', name: 'Snacks', icon: '🥟' },
  { id: 'beverages', name: 'Drinks', icon: '🍹' },
  { id: 'desserts', name: 'Desserts', icon: '🍨' },
];

// Meal time categories - items belong to multiple categories
export const mealTimeCategories: Record<string, string[]> = {
  breakfast: ['49', '40', '44', '46', '47', '52', '53'],
  lunch: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
  dinner: ['1', '2', '6', '8', '9', '10', '11', '12', '13', '14', '15', '16', '18', '19', '20', '21', '22', '23', '24', '25', '26'],
  supper: ['3', '4', '5', '7', '17', '27', '28', '36', '37', '49', '52'],
};
