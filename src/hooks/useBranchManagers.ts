import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchManagerRow {
  id: string;
  user_id: string;
  branch_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
}

export interface BranchManagerWithDetails extends BranchManagerRow {
  full_name: string | null;
  email: string | null;
  branch_name: string | null;
}

export const useBranchManagers = () => {
  return useQuery({
    queryKey: ['branch_managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_managers')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as BranchManagerRow[];
      if (rows.length === 0) return [] as BranchManagerWithDetails[];

      const userIds = rows.map((r) => r.user_id);
      const branchIds = rows.map((r) => r.branch_id);

      const [{ data: profiles }, { data: branches }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds),
        supabase.from('branches').select('id, name').in('id', branchIds),
      ]);

      return rows.map((r) => {
        const p = profiles?.find((x: any) => x.user_id === r.user_id);
        const b = branches?.find((x: any) => x.id === r.branch_id);
        return {
          ...r,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          branch_name: b?.name ?? null,
        } as BranchManagerWithDetails;
      });
    },
  });
};

export const useMyBranchAssignment = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['my_branch_assignment', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('branch_managers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as BranchManagerRow | null;
    },
    enabled: !!userId,
  });
};

export const useAssignBranchManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, branchId }: { email: string; branchId: string }) => {
      // Find user by email in profiles
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) {
        throw new Error('No user found with that email. Ask them to sign up first.');
      }

      // Deactivate any current manager of this branch
      await supabase
        .from('branch_managers')
        .update({ is_active: false })
        .eq('branch_id', branchId)
        .eq('is_active', true);

      // Insert new assignment
      const { data: { user: actor } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('branch_managers')
        .upsert({
          user_id: profile.user_id,
          branch_id: branchId,
          assigned_by: actor?.id,
          is_active: true,
        }, { onConflict: 'branch_id,user_id' })
        .select()
        .single();
      if (error) throw error;

      // Grant branch_manager role
      await supabase
        .from('user_roles')
        .upsert({
          user_id: profile.user_id,
          role: 'branch_manager' as any,
        }, { onConflict: 'user_id,role' as any });

      // Set this user's profile.branch_id so they're tied to the branch
      await supabase
        .from('profiles')
        .update({ branch_id: branchId })
        .eq('user_id', profile.user_id);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch_managers'] });
    },
  });
};

export const useRemoveBranchManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (managerRowId: string) => {
      const { data: row, error: e1 } = await supabase
        .from('branch_managers')
        .select('user_id')
        .eq('id', managerRowId)
        .single();
      if (e1) throw e1;

      const { error } = await supabase
        .from('branch_managers')
        .update({ is_active: false })
        .eq('id', managerRowId);
      if (error) throw error;

      // Revoke branch_manager role (keep 'user' role)
      if (row?.user_id) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', row.user_id)
          .eq('role', 'branch_manager' as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch_managers'] });
    },
  });
};
