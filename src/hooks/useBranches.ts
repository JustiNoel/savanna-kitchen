import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Branch {
  id: string;
  name: string;
  university: string;
  location: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useActiveBranches = () => {
  return useQuery({
    queryKey: ['branches', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return (data || []) as Branch[];
    },
  });
};

export const useAllBranches = () => {
  return useQuery({
    queryKey: ['branches', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Branch[];
    },
  });
};

export const useBranch = (branchId: string | null | undefined) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      if (!branchId) return null;
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .maybeSingle();
      if (error) throw error;
      return data as Branch | null;
    },
    enabled: !!branchId,
  });
};

export const useUpsertBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Branch> & { name: string; university: string }) => {
      if (input.id) {
        const { data, error } = await supabase
          .from('branches')
          .update({
            name: input.name,
            university: input.university,
            location: input.location,
            status: input.status,
          })
          .eq('id', input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: input.name,
          university: input.university,
          location: input.location || null,
          status: input.status || 'active',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useDeleteBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-disable instead of hard delete to preserve order history
      const { error } = await supabase
        .from('branches')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (error) throw error;
      // Deactivate any managers
      await supabase
        .from('branch_managers')
        .update({ is_active: false })
        .eq('branch_id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      qc.invalidateQueries({ queryKey: ['branch_managers'] });
    },
  });
};
