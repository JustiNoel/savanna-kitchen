import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ShoppingBag, CalendarDays, UtensilsCrossed, Sparkles, Trophy, Users, Lock, Eye, EyeOff, MapPin, UserPlus, Shield, Leaf, Store } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

interface WeeklySpecialForm {
  menu_item_id: string;
  menu_item_name: string;
  original_price: string;
  discount_percentage: string;
  discounted_price: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
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

const emptySpecialForm: WeeklySpecialForm = {
  menu_item_id: '',
  menu_item_name: '',
  original_price: '',
  discount_percentage: '20',
  discounted_price: '',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  is_active: true,
};

const ADMIN_PASSWORD = 'SavannaAdmin2024';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signIn } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<MenuItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Weekly Specials state
  const [specialFormData, setSpecialFormData] = useState<WeeklySpecialForm>(emptySpecialForm);
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null);
  const [specialDialogOpen, setSpecialDialogOpen] = useState(false);
  
  // Admin management state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);

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

  // Fetch all weekly specials
  const { data: weeklySpecials, isLoading: specialsLoading } = useQuery({
    queryKey: ['admin-weekly-specials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_specials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all loyalty points with user info
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['admin-loyalty-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('points', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch loyalty transactions
  const { data: loyaltyTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-loyalty-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all admins
  const { data: adminUsers, isLoading: adminsLoading, refetch: refetchAdmins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('role', 'admin');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch grocery items
  const { data: groceryItems, isLoading: groceryLoading } = useQuery({
    queryKey: ['admin-grocery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch shop items
  const { data: shopItems, isLoading: shopLoading } = useQuery({
    queryKey: ['admin-shop-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

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

  // Create/Update weekly special mutation
  const saveWeeklySpecial = useMutation({
    mutationFn: async (data: WeeklySpecialForm) => {
      const specialData = {
        menu_item_id: data.menu_item_id,
        menu_item_name: data.menu_item_name,
        original_price: parseInt(data.original_price),
        discount_percentage: parseInt(data.discount_percentage),
        discounted_price: parseInt(data.discounted_price),
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active,
      };

      if (editingSpecialId) {
        const { error } = await supabase
          .from('weekly_specials')
          .update(specialData)
          .eq('id', editingSpecialId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('weekly_specials')
          .insert(specialData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-specials'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-specials'] });
      toast.success(editingSpecialId ? 'Weekly special updated!' : 'Weekly special created!');
      setSpecialDialogOpen(false);
      setSpecialFormData(emptySpecialForm);
      setEditingSpecialId(null);
    },
    onError: (error) => {
      toast.error('Failed to save weekly special');
      console.error(error);
    },
  });

  // Delete weekly special mutation
  const deleteWeeklySpecial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_specials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-specials'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-specials'] });
      toast.success('Weekly special deleted');
    },
  });

  // Add admin mutation
  const addAdmin = useMutation({
    mutationFn: async (email: string) => {
      // First find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User not found. Make sure they have created an account first.');
      }

      // Check if already admin
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('role', 'admin')
        .single();

      if (existing) {
        throw new Error('This user is already an admin.');
      }

      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.user_id, role: 'admin' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin added successfully!');
      setNewAdminEmail('');
      setAddAdminDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove admin mutation
  const removeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      // Don't allow removing yourself
      if (userId === user?.id) {
        throw new Error('You cannot remove yourself as admin.');
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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

  const handleEditSpecial = (special: any) => {
    setSpecialFormData({
      menu_item_id: special.menu_item_id,
      menu_item_name: special.menu_item_name,
      original_price: special.original_price.toString(),
      discount_percentage: special.discount_percentage.toString(),
      discounted_price: special.discounted_price.toString(),
      start_date: special.start_date,
      end_date: special.end_date,
      is_active: special.is_active,
    });
    setEditingSpecialId(special.id);
    setSpecialDialogOpen(true);
  };

  const handleSpecialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialFormData.menu_item_name || !specialFormData.original_price) {
      toast.error('Menu item and original price are required');
      return;
    }
    saveWeeklySpecial.mutate(specialFormData);
  };

  const handleMenuItemSelectForSpecial = (itemId: string) => {
    const item = menuItems?.find(m => m.id === itemId);
    if (item) {
      const discountPercent = parseInt(specialFormData.discount_percentage) || 20;
      const discountedPrice = Math.round(item.price * (1 - discountPercent / 100));
      setSpecialFormData({
        ...specialFormData,
        menu_item_id: item.id,
        menu_item_name: item.name,
        original_price: item.price.toString(),
        discounted_price: discountedPrice.toString(),
      });
    }
  };

  const handleDiscountChange = (percent: string) => {
    const discountPercent = parseInt(percent) || 0;
    const originalPrice = parseInt(specialFormData.original_price) || 0;
    const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
    setSpecialFormData({
      ...specialFormData,
      discount_percentage: percent,
      discounted_price: discountedPrice.toString(),
    });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { error } = await signIn(adminEmail, adminPassword);
      if (error) {
        setLoginError(error.message);
      }
    } catch (err) {
      setLoginError('An error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>
                Please sign in with your admin credentials to access the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@savannakitchen.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {loginError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {loginError}
                  </motion.p>
                )}

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <Button variant="link" onClick={() => navigate('/')}>
                    Go Back Home
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
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
          <TabsList className="grid w-full max-w-6xl grid-cols-8 gap-1">
            <TabsTrigger value="menu" className="flex items-center gap-1 text-xs sm:text-sm">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="groceries" className="flex items-center gap-1 text-xs sm:text-sm">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Grocery</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-1 text-xs sm:text-sm">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs sm:text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1 text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Reservations</span>
            </TabsTrigger>
            <TabsTrigger value="specials" className="flex items-center gap-1 text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Specials</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-1 text-xs sm:text-sm">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Loyalty</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-1 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admins</span>
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

          {/* Weekly Specials Tab */}
          <TabsContent value="specials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Weekly Specials</h2>
              <Dialog open={specialDialogOpen} onOpenChange={setSpecialDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSpecialFormData(emptySpecialForm); setEditingSpecialId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Special
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingSpecialId ? 'Edit Weekly Special' : 'Add Weekly Special'}</DialogTitle>
                    <DialogDescription>
                      {editingSpecialId ? 'Update the special details' : 'Create a new weekly special offer'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSpecialSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Menu Item *</Label>
                      <Select
                        value={specialFormData.menu_item_id}
                        onValueChange={handleMenuItemSelectForSpecial}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a menu item" />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - KSh {item.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Original Price (KSh)</Label>
                        <Input
                          type="number"
                          value={specialFormData.original_price}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Select
                          value={specialFormData.discount_percentage}
                          onValueChange={handleDiscountChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="15">15%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="30">30%</SelectItem>
                            <SelectItem value="40">40%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Discounted Price (KSh)</Label>
                      <Input
                        type="number"
                        value={specialFormData.discounted_price}
                        disabled
                        className="bg-muted font-bold text-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={specialFormData.start_date}
                          onChange={(e) => setSpecialFormData({ ...specialFormData, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={specialFormData.end_date}
                          onChange={(e) => setSpecialFormData({ ...specialFormData, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={specialFormData.is_active}
                        onCheckedChange={(c) => setSpecialFormData({ ...specialFormData, is_active: c })}
                      />
                      <Label>Active</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveWeeklySpecial.isPending}>
                      {saveWeeklySpecial.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingSpecialId ? 'Update Special' : 'Create Special'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {specialsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {weeklySpecials?.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No weekly specials yet. Create one to highlight featured dishes!
                    </CardContent>
                  </Card>
                ) : (
                  weeklySpecials?.map((special) => (
                    <Card key={special.id} className={!special.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{special.menu_item_name}</h3>
                                {special.is_active ? (
                                  <Badge className="bg-green-500">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm line-through text-muted-foreground">
                                  KSh {special.original_price.toLocaleString()}
                                </span>
                                <span className="font-bold text-primary">
                                  KSh {special.discounted_price.toLocaleString()}
                                </span>
                                <Badge variant="outline" className="text-green-600">
                                  -{special.discount_percentage}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(special.start_date), 'MMM d')} - {format(new Date(special.end_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditSpecial(special)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteWeeklySpecial.mutate(special.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Loyalty Points Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <h2 className="text-2xl font-bold">Loyalty Program</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{loyaltyData?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Points Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {loyaltyData?.reduce((sum, l) => sum + (l.total_earned || 0), 0).toLocaleString() || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Points Redeemed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">
                      {loyaltyData?.reduce((sum, l) => sum + (l.total_redeemed || 0), 0).toLocaleString() || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Loyalty Table */}
            <Card>
              <CardHeader>
                <CardTitle>Member Points</CardTitle>
                <CardDescription>View and track loyalty points for all customers</CardDescription>
              </CardHeader>
              <CardContent>
                {loyaltyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : loyaltyData?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No loyalty members yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Current Points</TableHead>
                        <TableHead className="text-right">Total Earned</TableHead>
                        <TableHead className="text-right">Total Redeemed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyaltyData?.map((loyalty) => (
                        <TableRow key={loyalty.id}>
                          <TableCell className="font-medium">
                            {(loyalty.profiles as any)?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {(loyalty.profiles as any)?.email || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-bold">
                              {loyalty.points.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            +{loyalty.total_earned.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            -{loyalty.total_redeemed.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest loyalty point activities</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : loyaltyTransactions?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyaltyTransactions?.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {(tx.profiles as any)?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.type === 'earn' ? 'default' : 'secondary'}>
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{tx.source}</TableCell>
                          <TableCell className={`text-right font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                            {tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Management Tab */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Management</h2>
              <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>
                      Enter the email of a registered user to grant admin access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">User Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="user@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => addAdmin.mutate(newAdminEmail)}
                      disabled={addAdmin.isPending || !newAdminEmail}
                    >
                      {addAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Add as Admin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {adminsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {adminUsers?.map((admin) => (
                  <Card key={admin.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Shield className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{(admin.profiles as any)?.full_name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{(admin.profiles as any)?.email}</p>
                            <Badge className="mt-1">Admin</Badge>
                          </div>
                        </div>
                        {admin.user_id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove admin privileges from {(admin.profiles as any)?.email}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeAdmin.mutate(admin.user_id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
