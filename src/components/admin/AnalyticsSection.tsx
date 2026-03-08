import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Clock, ShoppingBag, DollarSign } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const AnalyticsSection = () => {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, payment_status')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['analytics-order-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('item_name, quantity, subtotal');
      if (error) throw error;
      return data;
    },
  });

  const { data: ratings } = useQuery({
    queryKey: ['analytics-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_ratings')
        .select('food_rating, delivery_rating');
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ['analytics-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, expense_date');
      if (error) throw error;
      return data;
    },
  });

  const dailySales = useMemo(() => {
    if (!orders) return [];
    const last30 = subDays(new Date(), 30);
    const map = new Map<string, number>();
    for (let i = 0; i <= 30; i++) {
      const d = format(subDays(new Date(), 30 - i), 'MMM dd');
      map.set(d, 0);
    }
    orders
      .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= last30)
      .forEach(o => {
        const d = format(new Date(o.created_at), 'MMM dd');
        map.set(d, (map.get(d) || 0) + Number(o.total_amount));
      });
    return Array.from(map, ([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const topItems = useMemo(() => {
    if (!orderItems) return [];
    const map = new Map<string, { qty: number; revenue: number }>();
    orderItems.forEach(i => {
      const cur = map.get(i.item_name) || { qty: 0, revenue: 0 };
      cur.qty += i.quantity;
      cur.revenue += Number(i.subtotal);
      map.set(i.item_name, cur);
    });
    return Array.from(map, ([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [orderItems]);

  const peakHours = useMemo(() => {
    if (!orders) return [];
    const hours = Array(24).fill(0);
    orders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hours[h]++;
    });
    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      orders: count,
    }));
  }, [orders]);

  const stats = useMemo(() => {
    if (!orders) return { totalRevenue: 0, avgOrder: 0, totalOrders: 0, paidOrders: 0 };
    const paid = orders.filter(o => o.payment_status === 'paid');
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total_amount), 0);
    return {
      totalRevenue,
      avgOrder: paid.length ? Math.round(totalRevenue / paid.length) : 0,
      totalOrders: orders.length,
      paidOrders: paid.length,
    };
  }, [orders]);

  const avgRatings = useMemo(() => {
    if (!ratings || ratings.length === 0) return { food: 0, delivery: 0, count: 0 };
    const food = ratings.reduce((s, r) => s + r.food_rating, 0) / ratings.length;
    const delivery = ratings.reduce((s, r) => s + r.delivery_rating, 0) / ratings.length;
    return { food: food.toFixed(1), delivery: delivery.toFixed(1), count: ratings.length };
  }, [ratings]);

  if (ordersLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">KSh {stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.paidOrders}</p>
            <p className="text-xs text-muted-foreground">Paid Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">KSh {stats.avgOrder.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl">⭐</span>
            <p className="text-2xl font-bold">{avgRatings.food || '—'}</p>
            <p className="text-xs text-muted-foreground">Avg Food Rating ({avgRatings.count})</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `KSh ${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs w-6 justify-center">{i + 1}</Badge>
                    <span className="text-sm font-medium truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{item.qty} sold</span>
                    <p className="text-xs text-muted-foreground">KSh {item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No order data yet</p>}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" /> Peak Order Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ratings Summary */}
      {avgRatings.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Ratings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-500">⭐ {avgRatings.food}</p>
                <p className="text-sm text-muted-foreground mt-1">Food Quality</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-blue-500">🚚 {avgRatings.delivery}</p>
                <p className="text-sm text-muted-foreground mt-1">Delivery Experience</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">Based on {avgRatings.count} ratings</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsSection;
