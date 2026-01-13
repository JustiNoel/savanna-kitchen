import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export const useOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (orderData: {
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      totalAmount: number;
      notes?: string;
      paymentMethod?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to place an order');
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: orderData.totalAmount,
          notes: orderData.notes,
          status: 'pending',
          payment_status: 'pending',
          payment_method: orderData.paymentMethod || 'pending',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
