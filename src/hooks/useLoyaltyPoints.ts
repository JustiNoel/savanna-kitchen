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

      // First, update or create loyalty points
      const { data: existing } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('loyalty_points')
          .update({
            points: existing.points + points,
            total_earned: existing.total_earned + points,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points,
            total_earned: points,
            total_redeemed: 0,
          });
      }

      // Add transaction record
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          points,
          type: 'earn',
          source,
          reference_id: referenceId,
          description: description || `Earned ${points} points from ${source}`,
        });

      if (txError) throw txError;

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

      const { data: existing } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existing || existing.points < points) {
        throw new Error('Insufficient points');
      }

      await supabase
        .from('loyalty_points')
        .update({
          points: existing.points - points,
          total_redeemed: existing.total_redeemed + points,
        })
        .eq('user_id', user.id);

      // Add transaction record
      await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          points,
          type: 'redeem',
          source: 'discount',
          description: `Redeemed ${points} points for ${discount}% discount`,
        });

      return { discount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
    },
  });
};
