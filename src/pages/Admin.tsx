import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ShoppingBag, CalendarDays, UtensilsCrossed } from 'lucide-react';

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  ingredients: string;
  image_url: string;
  is_popular: boolean;
  is_vegetarian: boolean;
  spice_level: string;
  is_available: boolean;
}

const emptyForm: MenuItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'mains',
  ingredients: '',
  image_url: '',
  is_popular: false,
  is_vegetarian: false,
  spice_level: '0',
  is_available: true,
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<MenuItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all menu items (admin can see all)
  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all reservations
  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Create/Update menu item mutation
  const saveMenuItem = useMutation({
    mutationFn: async (data: MenuItemForm) => {
      const itemData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        ingredients: data.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        image_url: data.image_url || null,
        is_popular: data.is_popular,
        is_vegetarian: data.is_vegetarian,
        spice_level: parseInt(data.spice_level),
        is_available: data.is_available,
      };

      if (editingId) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(editingId ? 'Menu item updated!' : 'Menu item created!');
      setDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Failed to save menu item');
      console.error(error);
    },
  });

  // Delete menu item mutation
  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item deleted');
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
  });

  // Update reservation status mutation
  const updateReservationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Reservation status updated');
    },
  });

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      ingredients: item.ingredients?.join(', ') || '',
      image_url: item.image_url || '',
      is_popular: item.is_popular || false,
      is_vegetarian: item.is_vegetarian || false,
      spice_level: (item.spice_level || 0).toString(),
      is_available: item.is_available ?? true,
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveMenuItem.mutate(formData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
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
              <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your restaurant</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Reservations
            </TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setFormData(emptyForm); setEditingId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the menu item details' : 'Add a new item to your menu'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (KSh) *</Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(v) => setFormData({ ...formData, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mains">Main Dishes</SelectItem>
                            <SelectItem value="sides">Sides</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Spice Level</Label>
                        <Select 
                          value={formData.spice_level} 
                          onValueChange={(v) => setFormData({ ...formData, spice_level: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            <SelectItem value="1">Mild 🌶️</SelectItem>
                            <SelectItem value="2">Medium 🌶️🌶️</SelectItem>
                            <SelectItem value="3">Hot 🌶️🌶️🌶️</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ingredients (comma-separated)</Label>
                      <Input
                        value={formData.ingredients}
                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                        placeholder="Beef, Rice, Onions, Spices"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_popular}
                          onCheckedChange={(c) => setFormData({ ...formData, is_popular: c })}
                        />
                        <Label>Popular</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_vegetarian}
                          onCheckedChange={(c) => setFormData({ ...formData, is_vegetarian: c })}
                        />
                        <Label>Vegetarian</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_available}
                          onCheckedChange={(c) => setFormData({ ...formData, is_available: c })}
                        />
                        <Label>Available</Label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveMenuItem.isPending}>
                      {saveMenuItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingId ? 'Update Item' : 'Add Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {menuLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {menuItems?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                              {item.is_popular && <Badge>Popular</Badge>}
                              {item.is_vegetarian && <Badge variant="outline">Veg</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="font-medium text-primary">KSh {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => deleteMenuItem.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-bold">Orders</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {orders?.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No orders yet
                    </CardContent>
                  </Card>
                ) : (
                  orders?.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPp')}
                            </p>
                            <p className="text-sm">
                              Customer: {(order.profiles as any)?.full_name || (order.profiles as any)?.email || 'Unknown'}
                            </p>
                            <div className="mt-2">
                              {order.order_items?.map((item: any) => (
                                <p key={item.id} className="text-sm">
                                  {item.quantity}x {item.item_name} - KSh {item.subtotal.toLocaleString()}
                                </p>
                              ))}
                            </div>
                            <p className="font-bold mt-2 text-primary">
                              Total: KSh {order.total_amount.toLocaleString()}
                            </p>
                          </div>
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateOrderStatus.mutate({ id: order.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <h2 className="text-2xl font-bold">Reservations</h2>
            {reservationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {reservations?.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No reservations yet
                    </CardContent>
                  </Card>
                ) : (
                  reservations?.map((res) => (
                    <Card key={res.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{res.guest_name}</h3>
                              <Badge className={getStatusColor(res.status || 'pending')}>{res.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(res.reservation_date), 'PPP')} at {res.reservation_time}
                            </p>
                            <p className="text-sm">{res.number_of_guests} guests</p>
                            <p className="text-sm">{res.guest_email}</p>
                            {res.guest_phone && <p className="text-sm">{res.guest_phone}</p>}
                            {res.special_requests && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Note: {res.special_requests}
                              </p>
                            )}
                          </div>
                          <Select
                            value={res.status || 'pending'}
                            onValueChange={(status) => updateReservationStatus.mutate({ id: res.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
