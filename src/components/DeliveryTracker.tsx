import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Bike, Package, CheckCircle, Navigation, Phone, MessageCircle, Satellite } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';

interface RiderLocation {
  lat: number;
  lng: number;
  lastUpdate: Date;
}

const DeliveryTracker = () => {
  const { user } = useAuth();
  const { data: orders = [] } = useOrders();
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Filter orders that are out for delivery
  const activeDeliveries = orders.filter(
    o => o.status === 'ready' || o.status === 'preparing' || o.status === 'delivering'
  );

  // Subscribe to real-time rider location updates
  useEffect(() => {
    if (activeDeliveries.length === 0) return;

    const channel = supabase
      .channel('rider-locations')
      .on('broadcast', { event: 'location_update' }, (payload) => {
        const { lat, lng, timestamp } = payload.payload;
        setRiderLocation({
          lat,
          lng,
          lastUpdate: new Date(timestamp),
        });
        setIsLiveTracking(true);

        // Calculate ETA based on distance (rough estimate)
        const order = activeDeliveries[0] as any;
        if (order.delivery_latitude && order.delivery_longitude) {
          const distance = calculateDistance(
            lat, lng,
            order.delivery_latitude, order.delivery_longitude
          );
          // Assume average speed of 30 km/h
          const timeInMinutes = Math.round((distance / 30) * 60);
          setEta(Math.max(timeInMinutes, 2)); // Minimum 2 minutes
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDeliveries.length]);

  // Fallback: Simulate rider movement if no live tracking
  useEffect(() => {
    if (activeDeliveries.length === 0 || isLiveTracking) return;

    const order = activeDeliveries[0] as any;
    const deliveryLat = order.delivery_latitude;
    const deliveryLng = order.delivery_longitude;

    if (!deliveryLat || !deliveryLng) return;

    // Maseno Siriba, Kisumu coordinates (restaurant location)
    const restaurantLat = -0.0011;
    const restaurantLng = 34.6015;

    let progress = 0;

    const interval = setInterval(() => {
      progress += 0.02;
      
      if (progress >= 1) {
        clearInterval(interval);
        return;
      }

      const currentLat = restaurantLat + (deliveryLat - restaurantLat) * progress;
      const currentLng = restaurantLng + (deliveryLng - restaurantLng) * progress;

      setRiderLocation({
        lat: currentLat,
        lng: currentLng,
        lastUpdate: new Date(),
      });

      const remainingProgress = 1 - progress;
      const totalDeliveryTime = 30;
      setEta(Math.round(remainingProgress * totalDeliveryTime));
    }, 3000);

    setRiderLocation({
      lat: restaurantLat,
      lng: restaurantLng,
      lastUpdate: new Date(),
    });
    setEta(30);

    return () => clearInterval(interval);
  }, [activeDeliveries.length, isLiveTracking]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!user || activeDeliveries.length === 0) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Package, color: 'bg-yellow-500', text: 'Order Received' };
      case 'preparing':
        return { icon: Package, color: 'bg-orange-500', text: 'Being Prepared' };
      case 'ready':
        return { icon: Bike, color: 'bg-blue-500', text: 'Out for Delivery' };
      case 'delivered':
        return { icon: CheckCircle, color: 'bg-green-500', text: 'Delivered' };
      default:
        return { icon: Package, color: 'bg-gray-500', text: status };
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Bike className="w-7 h-7 text-primary" />
            Live Delivery Tracking
            {isLiveTracking && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                <Satellite className="w-3 h-3 mr-1 animate-pulse" />
                GPS Live
              </Badge>
            )}
          </h2>

          <div className="space-y-4">
            {activeDeliveries.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const orderData = order as any;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Order #{order.id.slice(0, 8)}
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      </CardTitle>
                      {eta > 0 && order.status === 'ready' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 text-primary font-bold"
                        >
                          <Clock className="w-5 h-5" />
                          <span>{eta} min ETA</span>
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Map Visualization */}
                    <div className="relative h-48 bg-muted rounded-lg overflow-hidden mb-4">
                      {/* Simple map background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
                        {/* Grid lines for map effect */}
                        <div className="absolute inset-0 opacity-20">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={`h-${i}`} className="absolute w-full h-px bg-foreground" style={{ top: `${i * 10}%` }} />
                          ))}
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={`v-${i}`} className="absolute h-full w-px bg-foreground" style={{ left: `${i * 10}%` }} />
                          ))}
                        </div>
                      </div>

                      {/* Restaurant marker */}
                      <div className="absolute left-[20%] top-[30%] transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                          🍽️
                        </div>
                        <p className="text-xs mt-1 font-medium text-center">Grabbys</p>
                      </div>

                      {/* Delivery location marker */}
                      {orderData.delivery_latitude && (
                        <div className="absolute right-[20%] bottom-[30%] transform translate-x-1/2 translate-y-1/2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            🏠
                          </div>
                          <p className="text-xs mt-1 font-medium text-center">You</p>
                        </div>
                      )}

                      {/* Rider marker with animation */}
                      {riderLocation && order.status === 'ready' && (
                        <motion.div
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          animate={{
                            left: `${20 + (eta ? (30 - eta) / 30 * 60 : 0)}%`,
                            top: `${30 + (eta ? (30 - eta) / 30 * 40 : 0)}%`,
                          }}
                          transition={{ duration: 3, ease: 'linear' }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-orange-500/30"
                          >
                            <Bike className="w-5 h-5" />
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Route line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <motion.path
                          d="M 20% 30% Q 50% 50% 80% 70%"
                          stroke="hsl(var(--primary))"
                          strokeWidth="3"
                          strokeDasharray="10 5"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2 }}
                        />
                      </svg>
                    </div>

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Delivery Address</p>
                          <p className="text-sm text-muted-foreground">
                            {orderData.delivery_address || 'Location set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Rider Info</p>
                          <p className="text-sm text-muted-foreground">
                            John K. • ⭐ 4.8
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Rider */}
                    {order.status === 'ready' && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Rider
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DeliveryTracker;
