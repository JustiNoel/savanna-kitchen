import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useLoyaltyPoints = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-points', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddLoyaltyPoints = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      points, 
      source, 
      referenceId, 
      description 
    }: { 
      points: number; 
      source: 'order' | 'review' | 'referral'; 
      referenceId?: string;
      description?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('add_loyalty_points', {
        p_user_id: user.id,
        p_points: points,
        p_source: source,
        p_reference_id: referenceId || null,
        p_description: description || null,
      });

      if (error) throw error;
      return { points };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
    },
  });
};

export const useRedeemPoints = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      points, 
      discount 
    }: { 
      points: number; 
      discount: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('redeem_loyalty_points', {
        p_user_id: user.id,
        p_points: points,
        p_description: `Redeemed ${points} points for ${discount}% discount`,
      });

      if (error) throw error;
      return { discount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
    },
  });
};
