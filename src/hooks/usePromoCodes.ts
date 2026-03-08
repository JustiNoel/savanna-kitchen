import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export const usePromoCodes = () => {
  return useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });
};

export const useValidatePromoCode = () => {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) throw new Error('Invalid promo code');

      const promo = data as PromoCode;

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        throw new Error('This promo code has expired');
      }
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        throw new Error('This promo code has reached its usage limit');
      }
      if (orderAmount < promo.min_order_amount) {
        throw new Error(`Minimum order of KSh ${promo.min_order_amount} required`);
      }

      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = Math.round(orderAmount * (promo.discount_value / 100));
      } else {
        discount = Math.min(promo.discount_value, orderAmount);
      }

      return { promo, discount };
    },
  });
};

export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PromoCode>) => {
      const { error } = await supabase.from('promo_codes').insert({
        code: (data.code || '').toUpperCase().trim(),
        discount_type: data.discount_type || 'percentage',
        discount_value: data.discount_value || 0,
        min_order_amount: data.min_order_amount || 0,
        max_uses: data.max_uses || null,
        is_active: data.is_active ?? true,
        expires_at: data.expires_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] }),
  });
};

export const useTogglePromoCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('promo_codes').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] }),
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] }),
  });
};

export const useIncrementPromoUsage = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from('promo_codes')
        .select('used_count')
        .eq('id', id)
        .single();
      if (current) {
        await supabase.from('promo_codes').update({ used_count: current.used_count + 1 }).eq('id', id);
      }
    },
  });
};
