import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Loader2, Store, Package, Clock, CheckCircle2, XCircle, TrendingUp,
  Users, AlertTriangle, RefreshCcw, ChefHat,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useUserBranch } from '@/hooks/useUserBranch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

const BranchDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isBranchManager, managedBranchId, managedBranch, loading: branchLoading } = useUserBranch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');

  // Auth gate
  useEffect(() => {
    if (authLoading || branchLoading) return;
    if (!user) navigate('/auth');
    else if (!isBranchManager && !isAdmin) navigate('/');
  }, [user, isBranchManager, isAdmin, authLoading, branchLoading, navigate]);

  const branchId = managedBranchId;

  // ===== Live orders for this branch =====
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['branch-orders', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  // Realtime
  useEffect(() => {
    if (!branchId) return;
    const ch = supabase
      .channel('branch-dash-rt-' + branchId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['branch-orders', branchId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [branchId, queryClient]);

  // ===== Branch menu items =====
  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ['branch-menu', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .or(`branch_id.eq.${branchId},branch_id.is.null`)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  // ===== Mutations =====
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === 'delivered') patch.delivered_at = new Date().toISOString();
      const { error } = await supabase.from('orders').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['branch-orders', branchId] });
    },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: available })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-menu', branchId] });
    },
    onError: (e: any) => toast.error(e.message || 'Could not update'),
  });

  // ===== Stats =====
  const stats = useMemo(() => {
    const list = orders || [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = list.filter(o => new Date(o.created_at) >= today);
    const pending = list.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
    const revenue = list
      .filter(o => o.payment_status === 'paid' && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total_amount), 0);
    return {
      todayCount: todayOrders.length,
      pendingCount: pending.length,
      revenue,
      totalOrders: list.length,
    };
  }, [orders]);

  if (authLoading || branchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isBranchManager && !isAdmin) return null;

  if (!branchId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No branch assigned</h1>
          <p className="text-muted-foreground mb-6">
            Your account isn't linked to a branch yet. Please contact the super admin.
          </p>
          <Button onClick={() => navigate('/')}>Back home</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {managedBranch?.name || 'Branch Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {managedBranch?.university}{managedBranch?.location ? ` — ${managedBranch.location}` : ''}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['branch-orders', branchId] })}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Package className="h-4 w-4" />} label="Today" value={stats.todayCount} />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Active" value={stats.pendingCount} highlight={stats.pendingCount > 0} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Revenue" value={`KSh ${stats.revenue.toLocaleString()}`} />
          <StatCard icon={<Users className="h-4 w-4" />} label="All time" value={stats.totalOrders} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu / Stock</TabsTrigger>
          </TabsList>

          {/* ===== Orders ===== */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (orders?.length ?? 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ChefHat className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No orders yet for this branch.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[180px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders!.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(o.created_at), 'dd MMM HH:mm')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-semibold">KSh {Number(o.total_amount).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={o.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {o.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                                {o.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {o.status === 'cancelled' || o.status === 'delivered' ? (
                                <span className="text-xs text-muted-foreground italic">closed</span>
                              ) : (
                                <Select
                                  value={o.status}
                                  onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_FLOW.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                    <SelectItem value="cancelled">cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Menu / Stock ===== */}
          <TabsContent value="menu" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Menu items at this branch</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {menuLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (menuItems?.length ?? 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No menu items.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="w-[140px]">Available</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuItems!.map((m: any) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{m.category || '—'}</TableCell>
                            <TableCell>KSh {Number(m.price).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">
                              {m.stock_quantity ?? '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!m.is_available}
                                  onCheckedChange={(v) => toggleAvailability.mutate({ id: m.id, available: v })}
                                />
                                {m.is_available ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-rose-500" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({
  icon, label, value, highlight = false,
}: { icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }) => (
  <Card className={highlight ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default BranchDashboard;
