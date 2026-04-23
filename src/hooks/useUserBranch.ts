import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Returns the current user's profile (incl. branch_id) and their branch_manager assignment.
 */
export const useUserBranch = () => {
  const { user } = useAuth();

  const profileQ = useQuery({
    queryKey: ['user-profile-branch', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, branch_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const managerQ = useQuery({
    queryKey: ['user-branch-manager', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('branch_managers')
        .select('*, branches(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    profile: profileQ.data,
    branchId: profileQ.data?.branch_id ?? null,
    isBranchManager: !!managerQ.data,
    managedBranchId: managerQ.data?.branch_id ?? null,
    managedBranch: (managerQ.data as any)?.branches ?? null,
    loading: profileQ.isLoading || managerQ.isLoading,
  };
};
