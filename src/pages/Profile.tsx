import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useReservations } from '@/hooks/useReservations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, ShoppingBag, CalendarDays, User, Award, Star } from 'lucide-react';
import LoyaltyPoints from '@/components/LoyaltyPoints';
import OrderRatingDialog from '@/components/OrderRatingDialog';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: reservations, isLoading: reservationsLoading } = useReservations();
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);

  // Fetch user's existing ratings
  const { data: userRatings, refetch: refetchRatings } = useQuery({
    queryKey: ['user-ratings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_ratings')
        .select('order_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return new Set(data.map((r: any) => r.order_id));
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      delivered: 'bg-green-700',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">My Account</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs sm:text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-1 text-xs sm:text-sm">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1 text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-bold">Order History</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Button className="mt-4" onClick={() => navigate('/')}>
                    Start Ordering
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders?.map((order) => {
                  const isDelivered = order.status === 'delivered';
                  const alreadyRated = userRatings?.has(order.id);
                  return (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              {order.payment_status === 'paid' && (
                                <Badge className="bg-green-500 text-white">✅ Paid</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPp')}
                            </p>
                          </div>
                          <p className="font-bold text-primary">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="border-t border-border pt-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm py-1">
                                <span>{item.quantity}x {item.item_name}</span>
                                <span className="text-primary font-medium">KSh {item.subtotal.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Rate Order button for delivered, unrated orders */}
                        {isDelivered && !alreadyRated && (
                          <div className="border-t border-border pt-3 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => setRatingOrderId(order.id)}
                            >
                              <Star className="h-4 w-4 mr-2 text-yellow-400" />
                              Rate This Order
                            </Button>
                          </div>
                        )}
                        {isDelivered && alreadyRated && (
                          <div className="border-t border-border pt-3 mt-3">
                            <p className="text-xs text-muted-foreground text-center">✅ You rated this order</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              My Rewards
            </h2>
            <LoyaltyPoints />
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <h2 className="text-2xl font-bold">My Reservations</h2>
            {reservationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reservations?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reservations yet</p>
                  <Button className="mt-4" onClick={() => navigate('/#reservations')}>
                    Book a Table
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reservations?.map((res) => (
                  <Card key={res.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {format(new Date(res.reservation_date), 'PPP')}
                            </h3>
                            <Badge className={getStatusColor(res.status || 'pending')}>
                              {res.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Time: {res.reservation_time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {res.number_of_guests} guests
                          </p>
                          {res.special_requests && (
                            <p className="text-sm mt-2">
                              <span className="text-muted-foreground">Notes:</span> {res.special_requests}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member Since</label>
                  <p className="font-medium">
                    {format(new Date(user.created_at), 'PPP')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rating Dialog */}
      <OrderRatingDialog
        open={!!ratingOrderId}
        onOpenChange={(open) => !open && setRatingOrderId(null)}
        orderId={ratingOrderId || ''}
        onRated={() => refetchRatings()}
      />
    </div>
  );
};

export default Profile;
