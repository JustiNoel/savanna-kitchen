import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Reservation {
  id: string;
  user_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests: string | null;
  status: string | null;
  created_at: string;
}

export const useReservations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('reservation_date', { ascending: true });
      
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (reservationData: {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      reservationDate: string;
      reservationTime: string;
      numberOfGuests: number;
      specialRequests?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to make a reservation');
      
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          guest_name: reservationData.guestName,
          guest_email: reservationData.guestEmail,
          guest_phone: reservationData.guestPhone,
          reservation_date: reservationData.reservationDate,
          reservation_time: reservationData.reservationTime,
          number_of_guests: reservationData.numberOfGuests,
          special_requests: reservationData.specialRequests,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};
