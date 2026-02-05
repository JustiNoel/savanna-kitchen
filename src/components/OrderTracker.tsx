import { useEffect, useMemo } from 'react';
import { Package, ChefHat, Truck, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders, Order } from '@/hooks/useOrders';

const statusSteps = [
  { status: 'pending', label: 'Order Placed', icon: Package, description: 'Your order has been received' },
  { status: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Our chefs are cooking your meal' },
  { status: 'ready', label: 'Ready', icon: CheckCircle, description: 'Your order is ready for pickup/delivery' },
  { status: 'delivered', label: 'Delivered', icon: Truck, description: 'Enjoy your meal!' },
];

const OrderTracker = () => {
  const { user } = useAuth();
  const { data: orders = [], refetch } = useOrders();
  
  // Use useMemo instead of useEffect + useState to avoid re-render loops
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);


  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  if (!user) return null;
  if (activeOrders.length === 0) return null;

  const getStepIndex = (status: string) => {
    return statusSteps.findIndex(s => s.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent text-accent-foreground';
      case 'preparing': return 'bg-primary text-primary-foreground';
      case 'ready': return 'bg-secondary text-secondary-foreground';
      case 'delivered': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-7 h-7 text-primary" />
          Your Active Orders
        </h2>
        
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const currentStepIndex = getStepIndex(order.status);
            
            return (
              <Card key={order.id} className="bg-card/90 backdrop-blur-sm border-primary/20 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: KSh {order.total_amount.toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Progress Steps */}
                  <div className="relative">
                    <div className="flex justify-between items-start">
                      {statusSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        
                        return (
                          <div 
                            key={step.status} 
                            className="flex flex-col items-center relative z-10 flex-1"
                          >
                            <div 
                              className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                                ${isCompleted 
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                                  : 'bg-muted text-muted-foreground'
                                }
                                ${isCurrent ? 'ring-4 ring-primary/30 animate-pulse' : ''}
                              `}
                            >
                              <StepIcon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs mt-2 text-center font-medium ${
                              isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Progress Line */}
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Status Description */}
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-foreground text-center">
                      {statusSteps[currentStepIndex]?.description}
                    </p>
                  </div>

                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.order_items.map((item) => (
                          <Badge key={item.id} variant="outline" className="text-xs">
                            {item.quantity}x {item.item_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OrderTracker;
