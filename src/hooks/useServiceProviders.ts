import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceProvider {
  id: string;
  category_id: string | null;
  branch_id: string | null;
  name: string;
  service_title: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  location: string | null;
  image_url: string | null;
  price_from: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceProviderInput = Omit<
  ServiceProvider,
  'id' | 'created_at' | 'updated_at'
>;

const TABLE = 'service_providers';

export const useServiceProviders = (categoryId?: string, onlyActive = false) =>
  useQuery({
    queryKey: ['service-providers', categoryId, onlyActive],
    queryFn: async (): Promise<ServiceProvider[]> => {
      let q = supabase
        .from(TABLE)
        .select('*')
        .order('display_order', { ascending: true })
        .limit(100);
      if (categoryId) q = q.eq('category_id', categoryId);
      if (onlyActive) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ServiceProvider[];
    },
  });

export const useSaveServiceProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ServiceProviderInput> & { id?: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from(TABLE).update(rest).eq('id', id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from(TABLE)
        .insert(input as ServiceProviderInput);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Service provider saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save provider'),
  });
};

export const useDeleteServiceProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Service provider removed');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove provider'),
  });
};
