import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft, Loader2, MapPin, Phone, Navigation, 
  Package, CheckCircle, Clock, Truck, User, RefreshCw
} from 'lucide-react';

const RESTAURANT_LOCATION = {
  lat: -0.0011, // Maseno Siriba, Kisumu coordinates
  lng: 34.6015,
  address: 'Maseno Siriba, Kisumu',
};

const RIDER_PHONE = '+254105686703';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_instructions: string | null;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
  }>;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const Rider = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(true);
  const [isRider, setIsRider] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Start GPS tracking when rider is online
  useEffect(() => {
    if (!user || !isRider || !isAvailable) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Update rider location in database
        await supabase
          .from('riders')
          .update({
            current_latitude: latitude,
            current_longitude: longitude,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        // Broadcast location via realtime channel
        const channel = supabase.channel('rider-locations');
        channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            rider_id: user.id,
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString(),
          },
        });
      },
      (error) => {
        console.error('GPS Error:', error);
        toast.error('Unable to get your location. Please enable GPS.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);

    return () => {
      if (id !== null) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [user, isRider, isAvailable]);

  // Check if user is a rider
  useEffect(() => {
    const checkRiderRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'rider')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking rider role:', error);
        setIsRider(false);
        return;
      }
      
      setIsRider(!!data);
    };

    checkRiderRole();
  }, [user]);

  // Fetch rider's assigned orders
  const { data: assignedOrders, isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['rider-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get rider id
      const { data: riderData } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!riderData) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('rider_id', riderData.id)
        .in('status', ['preparing', 'ready', 'delivering'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately for each order
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          if (order.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('user_id', order.user_id)
              .single();
            return { ...order, profiles: profile };
          }
          return { ...order, profiles: null };
        })
      );
      
      return ordersWithProfiles as Order[];
    },
    enabled: isRider === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch available orders (not yet assigned)
  const { data: availableOrders, isLoading: availableLoading } = useQuery({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .is('rider_id', null)
        .eq('status', 'ready')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          if (order.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('user_id', order.user_id)
              .single();
            return { ...order, profiles: profile };
          }
          return { ...order, profiles: null };
        })
      );
      
      return ordersWithProfiles as Order[];
    },
    enabled: isRider === true,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Accept order mutation
  const acceptOrder = useMutation({
    mutationFn: async (orderId: string) => {
      // First get rider id
      const { data: riderData } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!riderData) throw new Error('Rider profile not found');

      const { error } = await supabase
        .from('orders')
        .update({ 
          rider_id: riderData.id,
          status: 'delivering',
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .is('rider_id', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast.success('Order accepted! Navigate to pickup location.');
    },
    onError: () => {
      toast.error('Failed to accept order. It may have been taken by another rider.');
    },
  });

  // Update order status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const updateData: Record<string, any> = { status };
      
      if (status === 'delivering') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      
      if (status === 'delivered') {
        toast.success('Order marked as delivered! 🎉');
      } else {
        toast.success('Order status updated');
      }
    },
  });

  // Toggle availability mutation
  const toggleAvailability = useMutation({
    mutationFn: async (available: boolean) => {
      const { error } = await supabase
        .from('riders')
        .update({ is_available: available })
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: (_, available) => {
      setIsAvailable(available);
      toast.success(available ? "You're now available for deliveries" : "You're now offline");
    },
  });

  const openNavigation = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const callCustomer = (phone: string | null) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast.error('Customer phone number not available');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      delivering: 'bg-blue-500',
      delivered: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'delivering': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (authLoading || isRider === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isRider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Rider Access Only</CardTitle>
              <CardDescription>
                This dashboard is for registered delivery riders only. 
                Contact admin to get rider access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">Rider Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                checked={isAvailable}
                onCheckedChange={(checked) => toggleAvailability.mutate(checked)}
              />
              <Label className={isAvailable ? 'text-green-600' : 'text-muted-foreground'}>
                {isAvailable ? 'Online' : 'Offline'}
              </Label>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Restaurant Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Pickup Location</p>
                  <p className="text-sm text-muted-foreground">{RESTAURANT_LOCATION.address}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNavigation(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Orders */}
        {availableOrders && availableOrders.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Available Orders ({availableOrders.length})
            </h2>
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="font-bold text-lg">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Items:</span>{' '}
                          {order.order_items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                        </p>
                        {order.delivery_address && (
                          <p className="text-sm flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            {order.delivery_address}
                          </p>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => acceptOrder.mutate(order.id)}
                        disabled={acceptOrder.isPending}
                      >
                        {acceptOrder.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Truck className="h-4 w-4 mr-2" />
                        )}
                        Accept Order
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* My Active Deliveries */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            My Active Deliveries ({assignedOrders?.length || 0})
          </h2>

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignedOrders?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No active deliveries</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept available orders to start delivering
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignedOrders?.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="font-bold text-lg">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {order.profiles?.full_name || 'Customer'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => callCustomer(order.profiles?.phone || null)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {order.order_items.map((item, idx) => (
                            <li key={idx}>• {item.quantity}x {item.item_name}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Delivery Address</p>
                              <p className="text-sm text-muted-foreground">
                                {order.delivery_address}
                              </p>
                            </div>
                          </div>
                          {order.delivery_instructions && (
                            <p className="text-xs text-muted-foreground italic pl-6">
                              Note: {order.delivery_instructions}
                            </p>
                          )}
                          {order.delivery_latitude && order.delivery_longitude && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => openNavigation(
                                order.delivery_latitude!,
                                order.delivery_longitude!
                              )}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Open in Google Maps
                            </Button>
                          )}
                        </div>
                      )}

                      {order.notes && (
                        <p className="text-sm text-muted-foreground mb-4">
                          <span className="font-medium">Order Notes:</span> {order.notes}
                        </p>
                      )}

                      {/* Status Update */}
                      <div className="flex gap-2">
                        {order.status === 'preparing' && (
                          <Button
                            className="flex-1"
                            variant="outline"
                            disabled
                          >
                            Waiting for kitchen...
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            className="flex-1"
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: 'delivering' })}
                            disabled={updateStatus.isPending}
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Truck className="h-4 w-4 mr-2" />
                            )}
                            Picked Up - Start Delivery
                          </Button>
                        )}
                        {order.status === 'delivering' && (
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: 'delivered' })}
                            disabled={updateStatus.isPending}
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Rider Contact */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Need help?</p>
                <p className="font-semibold">Contact Dispatch</p>
              </div>
              <Button variant="outline" onClick={() => window.open(`tel:${RIDER_PHONE}`, '_self')}>
                <Phone className="h-4 w-4 mr-2" />
                {RIDER_PHONE}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Rider;