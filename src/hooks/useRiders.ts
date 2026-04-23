import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Rider {
  id: string;
  user_id: string;
  phone: string;
  vehicle_type: string | null;
  is_available: boolean | null;
  current_latitude: number | null;
  current_longitude: number | null;
  created_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export const useRiders = () => {
  return useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const ridersWithProfiles = await Promise.all(
        (data || []).map(async (rider) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', rider.user_id)
            .single();
          return { ...rider, profiles: profile };
        })
      );
      
      return ridersWithProfiles as Rider[];
    },
  });
};

export const useCreateRider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, phone, vehicleType }: { 
      userId: string; 
      phone: string; 
      vehicleType?: string 
    }) => {
      // First add rider role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'rider' });
      
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Then create rider profile
      const { data, error } = await supabase
        .from('riders')
        .insert({
          user_id: userId,
          phone,
          vehicle_type: vehicleType || 'motorcycle',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useDeleteRider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ riderId, userId }: { riderId: string; userId: string }) => {
      // Unassign rider from orders first to avoid FK constraint
      const { error: unassignError } = await supabase
        .from('orders')
        .update({ rider_id: null })
        .eq('rider_id', riderId);
      
      if (unassignError) throw unassignError;

      // Delete rider profile
      const { error: riderError } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId);
      
      if (riderError) throw riderError;

      // Remove rider role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'rider');
      
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};