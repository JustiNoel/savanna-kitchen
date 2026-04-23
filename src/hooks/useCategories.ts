import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_protected: boolean;
  is_active: boolean;
  visibility: 'all' | 'specific';
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  visibility: 'all' | 'specific';
  branch_ids?: string[];
}

export const useCategories = (opts?: { onlyActive?: boolean }) => {
  const queryClient = useQueryClient();

  // Realtime sync
  useEffect(() => {
    const ch = supabase
      .channel('categories-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['categories', opts?.onlyActive ?? false],
    queryFn: async () => {
      let q = supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (opts?.onlyActive) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Category[];
    },
  });
};

export const useCategoryBranchVisibility = (categoryId?: string) => {
  return useQuery({
    queryKey: ['category-branch-visibility', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('category_branch_visibility')
        .select('*')
        .eq('category_id', categoryId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId,
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { branch_ids, ...payload } = input;
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      if (input.visibility === 'specific' && branch_ids?.length) {
        await supabase
          .from('category_branch_visibility')
          .insert(branch_ids.map((bid) => ({ category_id: data.id, branch_id: bid })));
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create category'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      const { branch_ids, ...payload } = input;
      const { error } = await supabase.from('categories').update(payload).eq('id', id);
      if (error) throw error;
      // Reset branch visibility
      await supabase.from('category_branch_visibility').delete().eq('category_id', id);
      if (input.visibility === 'specific' && branch_ids?.length) {
        await supabase
          .from('category_branch_visibility')
          .insert(branch_ids.map((bid) => ({ category_id: id, branch_id: bid })));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['category-branch-visibility'] });
      toast.success('Category updated');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update category'),
  });
};

export const useToggleCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete category'),
  });
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
