import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: string;
  updated_by: string | null;
}

const FALLBACK: AppSettings = {
  id: 1,
  maintenance_mode: false,
  maintenance_message:
    'Our ordering system is currently under maintenance. Updates are ongoing — please check back later. Thank you for your patience! 🛠️',
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/**
 * Reads global app settings (maintenance toggle, etc.) with realtime sync.
 */
export const useAppSettings = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return (data as AppSettings) ?? FALLBACK;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel('app-settings-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        () => qc.invalidateQueries({ queryKey: ['app-settings'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return {
    settings: query.data ?? FALLBACK,
    loading: query.isLoading,
  };
};

export const useUpdateAppSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<AppSettings, 'maintenance_mode' | 'maintenance_message'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .update({ ...patch, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-settings'] }),
  });
};
