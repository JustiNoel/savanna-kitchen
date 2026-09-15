import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryPaymentSetting {
  id: string;
  category_id: string;
  provider: string;
  account_name: string | null;
  paybill_number: string | null;
  till_number: string | null;
  account_number: string | null;
  bank_name: string | null;
  partner_name: string | null;
  payout_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryPaymentInput = Omit<
  CategoryPaymentSetting,
  'id' | 'created_at' | 'updated_at'
>;

const TABLE = 'category_payment_settings';

export const useCategoryPayments = () =>
  useQuery({
    queryKey: ['category-payments'],
    queryFn: async (): Promise<CategoryPaymentSetting[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CategoryPaymentSetting[];
    },
  });

export const useSaveCategoryPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryPaymentInput) => {
      const { error } = await supabase
        .from(TABLE)
        .upsert(input, { onConflict: 'category_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['category-payments'] });
      toast.success('Payment details saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save payment details'),
  });
};

export const useDeleteCategoryPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['category-payments'] });
      toast.success('Payment details removed');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove payment details'),
  });
};
