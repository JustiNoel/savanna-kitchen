import { useState, useEffect } from 'react';
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
import { 
  ArrowLeft, Plus, Pencil, Trash2, Loader2, ShoppingBag, CalendarDays, 
  UtensilsCrossed, Sparkles, Trophy, Users, Lock, Eye, EyeOff, MapPin, 
  UserPlus, Shield, Leaf, Store, Wine, Bike, Mail, Phone, DollarSign, Package
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import FinanceSection from '@/components/admin/FinanceSection';
import InventoryAlerts from '@/components/InventoryAlerts';

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

interface GroceryItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  unit: string;
  image_url: string;
  stock_quantity: string;
  is_available: boolean;
}

interface ShopItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  image_url: string;
  stock_quantity: string;
  is_available: boolean;
}

interface SpiritsItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  volume: string;
  alcohol_percentage: string;
  image_url: string;
  stock_quantity: string;
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
  item_source: 'food' | 'grocery' | 'shop' | 'spirits';
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

const emptyGroceryForm: GroceryItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'vegetables',
  unit: 'kg',
  image_url: '',
  stock_quantity: '100',
  is_available: true,
};

const emptyShopForm: ShopItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'household',
  brand: '',
  image_url: '',
  stock_quantity: '100',
  is_available: true,
};

const emptySpiritsForm: SpiritsItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'beer',
  brand: '',
  volume: '750ml',
  alcohol_percentage: '',
  image_url: '',
  stock_quantity: '50',
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
  item_source: 'food',
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signIn } = useAuth();
  const queryClient = useQueryClient();
  
  // Menu form state
  const [formData, setFormData] = useState<MenuItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Grocery form state
  const [groceryFormData, setGroceryFormData] = useState<GroceryItemForm>(emptyGroceryForm);
  const [editingGroceryId, setEditingGroceryId] = useState<string | null>(null);
  const [groceryDialogOpen, setGroceryDialogOpen] = useState(false);
  
  // Shop form state
  const [shopFormData, setShopFormData] = useState<ShopItemForm>(emptyShopForm);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  
  // Spirits form state
  const [spiritsFormData, setSpiritsFormData] = useState<SpiritsItemForm>(emptySpiritsForm);
  const [editingSpiritsId, setEditingSpiritsId] = useState<string | null>(null);
  const [spiritsDialogOpen, setSpiritsDialogOpen] = useState(false);
  
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
  
  // Rider management state
  const [newRiderEmail, setNewRiderEmail] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [addRiderDialogOpen, setAddRiderDialogOpen] = useState(false);

  // Fetch all menu items
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

  // Fetch all orders with profiles
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items (*)')
        .order('created_at', { ascending: false });
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
      
      return ordersWithProfiles;
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

  // Fetch all loyalty points
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['admin-loyalty-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('points', { ascending: false });
      if (error) throw error;
      
      const loyaltyWithProfiles = await Promise.all(
        (data || []).map(async (lp) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', lp.user_id)
            .single();
          return { ...lp, profiles: profile };
        })
      );
      
      return loyaltyWithProfiles;
    },
    enabled: isAdmin,
  });

  // Fetch all admins
  const { data: adminUsers, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin');
      if (error) throw error;
      
      const adminsWithProfiles = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', admin.user_id)
            .single();
          return { ...admin, profiles: profile };
        })
      );
      
      return adminsWithProfiles;
    },
    enabled: isAdmin,
  });

  // Fetch riders
  const { data: riders, isLoading: ridersLoading } = useQuery({
    queryKey: ['admin-riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
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
      
      return ridersWithProfiles;
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

  // Fetch spirits items
  const { data: spiritsItems, isLoading: spiritsLoading } = useQuery({
    queryKey: ['admin-spirits-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spirits_items')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // ============ REALTIME SUBSCRIPTIONS ============
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  // ============ MUTATIONS ============

  // Menu item mutations
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
        const { error } = await supabase.from('menu_items').update(itemData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(itemData);
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

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item deleted');
    },
  });

  // Grocery item mutations
  const saveGroceryItem = useMutation({
    mutationFn: async (data: GroceryItemForm) => {
      const itemData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        category: data.category,
        unit: data.unit,
        image_url: data.image_url || null,
        stock_quantity: parseInt(data.stock_quantity),
        is_available: data.is_available,
      };

      if (editingGroceryId) {
        const { error } = await supabase.from('grocery_items').update(itemData).eq('id', editingGroceryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('grocery_items').insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grocery-items'] });
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
      toast.success(editingGroceryId ? 'Grocery item updated!' : 'Grocery item created!');
      setGroceryDialogOpen(false);
      setGroceryFormData(emptyGroceryForm);
      setEditingGroceryId(null);
    },
    onError: (error) => {
      toast.error('Failed to save grocery item');
      console.error(error);
    },
  });

  const deleteGroceryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grocery-items'] });
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
      toast.success('Grocery item deleted');
    },
  });

  // Shop item mutations
  const saveShopItem = useMutation({
    mutationFn: async (data: ShopItemForm) => {
      const itemData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        category: data.category,
        brand: data.brand || null,
        image_url: data.image_url || null,
        stock_quantity: parseInt(data.stock_quantity),
        is_available: data.is_available,
      };

      if (editingShopId) {
        const { error } = await supabase.from('shop_items').update(itemData).eq('id', editingShopId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('shop_items').insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      toast.success(editingShopId ? 'Shop item updated!' : 'Shop item created!');
      setShopDialogOpen(false);
      setShopFormData(emptyShopForm);
      setEditingShopId(null);
    },
    onError: (error) => {
      toast.error('Failed to save shop item');
      console.error(error);
    },
  });

  const deleteShopItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      toast.success('Shop item deleted');
    },
  });

  // Spirits item mutations
  const saveSpiritsItem = useMutation({
    mutationFn: async (data: SpiritsItemForm) => {
      const itemData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        category: data.category,
        brand: data.brand || null,
        volume: data.volume || null,
        alcohol_percentage: data.alcohol_percentage ? parseFloat(data.alcohol_percentage) : null,
        image_url: data.image_url || null,
        stock_quantity: parseInt(data.stock_quantity),
        is_available: data.is_available,
      };

      if (editingSpiritsId) {
        const { error } = await supabase.from('spirits_items').update(itemData).eq('id', editingSpiritsId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('spirits_items').insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spirits-items'] });
      queryClient.invalidateQueries({ queryKey: ['spirits-items'] });
      toast.success(editingSpiritsId ? 'Spirits item updated!' : 'Spirits item created!');
      setSpiritsDialogOpen(false);
      setSpiritsFormData(emptySpiritsForm);
      setEditingSpiritsId(null);
    },
    onError: (error) => {
      toast.error('Failed to save spirits item');
      console.error(error);
    },
  });

  const deleteSpiritsItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spirits_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spirits-items'] });
      queryClient.invalidateQueries({ queryKey: ['spirits-items'] });
      toast.success('Spirits item deleted');
    },
  });

  // Order status mutation with email notification and payment verification
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, customerEmail, customerName, paymentStatus, transactionCode }: { 
      id: string; 
      status: string; 
      customerEmail?: string; 
      customerName?: string;
      paymentStatus?: string;
      transactionCode?: string;
    }) => {
      console.log('Updating order status:', { id, status, paymentStatus, transactionCode });
      
      // If changing to "delivering" or "delivered", verify payment first
      if (status === 'delivering' || status === 'delivered') {
        const normalizedPaymentStatus = paymentStatus?.toLowerCase()?.trim();
        const isPaid = normalizedPaymentStatus === 'paid';
        console.log('Payment check:', { normalizedPaymentStatus, isPaid });
        
        if (!isPaid) {
          throw new Error('PAYMENT_NOT_VERIFIED');
        }
      }
      
      const updateData: Record<string, any> = { status };
      
      // Add timestamps based on status
      if (status === 'delivering') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from('orders').update(updateData).eq('id', id);
      if (error) throw error;
      
      // Send status update email
      if (customerEmail) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'order_update',
              customerEmail,
              customerName: customerName || 'Customer',
              details: { orderId: id, status },
            },
          });
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't throw - status was updated successfully
        }
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Order status updated to "${status}"`, {
        description: 'Customer has been notified via email.',
      });
    },
    onError: (error: Error) => {
      if (error.message === 'PAYMENT_NOT_VERIFIED') {
        toast.error('Cannot mark as delivered!', {
          description: 'Payment has not been verified yet. Please ensure payment is confirmed first.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to update order status');
        console.error(error);
      }
    },
  });

  // Reservation status mutation with email notification
  const updateReservationStatus = useMutation({
    mutationFn: async ({ id, status, guestEmail, guestName }: { id: string; status: string; guestEmail?: string; guestName?: string }) => {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) throw error;
      
      if (guestEmail) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'reservation_update',
            customerEmail: guestEmail,
            customerName: guestName || 'Guest',
            details: { status },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Reservation status updated');
    },
  });

  // Weekly special mutations
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
        const { error } = await supabase.from('weekly_specials').update(specialData).eq('id', editingSpecialId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('weekly_specials').insert(specialData);
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
  });

  const deleteWeeklySpecial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_specials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-specials'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-specials'] });
      toast.success('Weekly special deleted');
    },
  });

  // Admin management mutations
  const addAdmin = useMutation({
    mutationFn: async (email: string) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User not found. Make sure they have created an account first.');
      }

      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('role', 'admin')
        .single();

      if (existing) {
        throw new Error('This user is already an admin.');
      }

      const { error } = await supabase.from('user_roles').insert({ user_id: profile.user_id, role: 'admin' });
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

  const removeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      if (userId === user?.id) {
        throw new Error('You cannot remove yourself as admin.');
      }
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
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

  // Rider management mutations
  const addRider = useMutation({
    mutationFn: async ({ email, phone }: { email: string; phone: string }) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User not found. Make sure they have created an account first.');
      }

      // Add rider role
      await supabase.from('user_roles').insert({ user_id: profile.user_id, role: 'rider' });
      
      // Create rider profile
      const { error } = await supabase.from('riders').insert({ 
        user_id: profile.user_id, 
        phone,
        vehicle_type: 'motorcycle',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] });
      toast.success('Rider added successfully!');
      setNewRiderEmail('');
      setNewRiderPhone('');
      setAddRiderDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeRider = useMutation({
    mutationFn: async ({ riderId, userId }: { riderId: string; userId: string }) => {
      // Delete rider profile first
      const { error: riderError } = await supabase.from('riders').delete().eq('id', riderId);
      if (riderError) {
        console.error('Rider delete error:', riderError);
        throw new Error('Failed to remove rider profile: ' + riderError.message);
      }
      
      // Then remove rider role
      const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'rider');
      if (roleError) {
        console.error('Role delete error:', roleError);
        throw new Error('Failed to remove rider role: ' + roleError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] });
      toast.success('Rider removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove rider');
    },
  });

  // Assign rider to order with email notification
  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId, order, riderInfo }: { 
      orderId: string; 
      riderId: string;
      order?: any;
      riderInfo?: { email: string; name: string };
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({ rider_id: riderId, assigned_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      
      // Send notification to rider
      if (riderInfo?.email && order) {
        try {
          // Get phone from order notes
          const phoneMatch = order.notes?.match(/Phone:\s*(\+?\d+)/);
          const deliveryPhone = phoneMatch ? phoneMatch[1] : order.profiles?.phone;
          
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'rider_assignment',
              customerEmail: order.profiles?.email || '',
              customerName: order.profiles?.full_name || 'Customer',
              details: {
                orderId: orderId,
                totalAmount: order.total_amount,
                items: order.order_items?.map((item: any) => ({
                  name: item.item_name,
                  quantity: item.quantity,
                  price: item.unit_price,
                })),
                deliveryAddress: order.delivery_address,
                deliveryPhone: deliveryPhone,
                deliveryLatitude: order.delivery_latitude,
                deliveryLongitude: order.delivery_longitude,
                riderEmail: riderInfo.email,
                riderName: riderInfo.name,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send rider notification:', emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Rider assigned and notified via email! 🚴', {
        description: 'Rider will see this order in their dashboard.',
      });
    },
  });

  // ============ HANDLERS ============

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

  const handleEditGrocery = (item: any) => {
    setGroceryFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      unit: item.unit || 'kg',
      image_url: item.image_url || '',
      stock_quantity: (item.stock_quantity || 100).toString(),
      is_available: item.is_available ?? true,
    });
    setEditingGroceryId(item.id);
    setGroceryDialogOpen(true);
  };

  const handleEditShop = (item: any) => {
    setShopFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      brand: item.brand || '',
      image_url: item.image_url || '',
      stock_quantity: (item.stock_quantity || 100).toString(),
      is_available: item.is_available ?? true,
    });
    setEditingShopId(item.id);
    setShopDialogOpen(true);
  };

  const handleEditSpirits = (item: any) => {
    setSpiritsFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      brand: item.brand || '',
      volume: item.volume || '750ml',
      alcohol_percentage: item.alcohol_percentage?.toString() || '',
      image_url: item.image_url || '',
      stock_quantity: (item.stock_quantity || 50).toString(),
      is_available: item.is_available ?? true,
    });
    setEditingSpiritsId(item.id);
    setSpiritsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveMenuItem.mutate(formData);
  };

  const handleGrocerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryFormData.name || !groceryFormData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveGroceryItem.mutate(groceryFormData);
  };

  const handleShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopFormData.name || !shopFormData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveShopItem.mutate(shopFormData);
  };

  const handleSpiritsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spiritsFormData.name || !spiritsFormData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveSpiritsItem.mutate(spiritsFormData);
  };

  const handleItemSelectForSpecial = (itemId: string, source: 'food' | 'grocery' | 'shop' | 'spirits') => {
    let item: any = null;
    if (source === 'food') {
      item = menuItems?.find(m => m.id === itemId);
    } else if (source === 'grocery') {
      item = groceryItems?.find(g => g.id === itemId);
    } else if (source === 'shop') {
      item = shopItems?.find(s => s.id === itemId);
    } else if (source === 'spirits') {
      item = spiritsItems?.find(sp => sp.id === itemId);
    }
    
    if (item) {
      const discountPercent = parseInt(specialFormData.discount_percentage) || 20;
      const discountedPrice = Math.round(item.price * (1 - discountPercent / 100));
      setSpecialFormData({
        ...specialFormData,
        menu_item_id: item.id,
        menu_item_name: item.name,
        original_price: item.price.toString(),
        discounted_price: discountedPrice.toString(),
        item_source: source,
      });
    }
  };

  const handleMenuItemSelectForSpecial = (itemId: string) => {
    handleItemSelectForSpecial(itemId, specialFormData.item_source);
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

  const handleSpecialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialFormData.menu_item_name || !specialFormData.original_price) {
      toast.error('Menu item and original price are required');
      return;
    }
    saveWeeklySpecial.mutate(specialFormData);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      delivering: 'bg-purple-500',
      delivered: 'bg-gray-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>Please sign in with your admin credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                {loginError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center">{loginError}</motion.p>}
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : 'Sign In'}
                </Button>
                <div className="text-center">
                  <Button variant="link" onClick={() => navigate('/')}>Go Back Home</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <p className="text-sm text-muted-foreground">Manage Grabbys</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="menu" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex min-w-max gap-1 p-1">
              <TabsTrigger value="menu" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Food</span>
              </TabsTrigger>
              <TabsTrigger value="groceries" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Leaf className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Grocery</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Shop</span>
              </TabsTrigger>
              <TabsTrigger value="spirits" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Wine className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Spirits</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Reservations</span>
              </TabsTrigger>
              <TabsTrigger value="specials" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Specials</span>
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Loyalty</span>
              </TabsTrigger>
              <TabsTrigger value="riders" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Bike className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Riders</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="finance" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Finance</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-3">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Inventory</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============ MENU TAB ============ */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Food Menu ({menuItems?.length || 0})</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setFormData(emptyForm); setEditingId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (KSh) *</Label>
                        <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Select value={formData.spice_level} onValueChange={(v) => setFormData({ ...formData, spice_level: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label>Image URL</Label>
                      <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={formData.is_popular} onCheckedChange={(c) => setFormData({ ...formData, is_popular: c })} />
                        <Label>Popular</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={formData.is_vegetarian} onCheckedChange={(c) => setFormData({ ...formData, is_vegetarian: c })} />
                        <Label>Vegetarian</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={formData.is_available} onCheckedChange={(c) => setFormData({ ...formData, is_available: c })} />
                        <Label>Available</Label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveMenuItem.isPending}>
                      {saveMenuItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingId ? 'Update Item' : 'Add Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {menuLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4">
                {menuItems?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                              {item.is_popular && <Badge>Popular</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                            <p className="font-medium text-primary">KSh {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMenuItem.mutate(item.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ GROCERY TAB ============ */}
          <TabsContent value="groceries" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Grocery Items ({groceryItems?.length || 0})</h2>
              <Dialog open={groceryDialogOpen} onOpenChange={setGroceryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setGroceryFormData(emptyGroceryForm); setEditingGroceryId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingGroceryId ? 'Edit Grocery Item' : 'Add Grocery Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGrocerySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={groceryFormData.name} onChange={(e) => setGroceryFormData({ ...groceryFormData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (KSh) *</Label>
                        <Input type="number" value={groceryFormData.price} onChange={(e) => setGroceryFormData({ ...groceryFormData, price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={groceryFormData.description} onChange={(e) => setGroceryFormData({ ...groceryFormData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={groceryFormData.category} onValueChange={(v) => setGroceryFormData({ ...groceryFormData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vegetables">Vegetables</SelectItem>
                            <SelectItem value="fruits">Fruits</SelectItem>
                            <SelectItem value="grains">Grains</SelectItem>
                            <SelectItem value="dairy">Dairy</SelectItem>
                            <SelectItem value="meat">Meat</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select value={groceryFormData.unit} onValueChange={(v) => setGroceryFormData({ ...groceryFormData, unit: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="g">Gram (g)</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="bunch">Bunch</SelectItem>
                            <SelectItem value="liter">Liter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input type="number" value={groceryFormData.stock_quantity} onChange={(e) => setGroceryFormData({ ...groceryFormData, stock_quantity: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input value={groceryFormData.image_url} onChange={(e) => setGroceryFormData({ ...groceryFormData, image_url: e.target.value })} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={groceryFormData.is_available} onCheckedChange={(c) => setGroceryFormData({ ...groceryFormData, is_available: c })} />
                      <Label>Available</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveGroceryItem.isPending}>
                      {saveGroceryItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingGroceryId ? 'Update Item' : 'Add Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {groceryLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4">
                {groceryItems?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🥬</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                              <Badge variant="outline">{item.stock_quantity} in stock</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{item.category} • {item.unit}</p>
                            <p className="font-medium text-primary">KSh {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditGrocery(item)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteGroceryItem.mutate(item.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ SHOP TAB ============ */}
          <TabsContent value="shop" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Shop Items ({shopItems?.length || 0})</h2>
              <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setShopFormData(emptyShopForm); setEditingShopId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingShopId ? 'Edit Shop Item' : 'Add Shop Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleShopSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={shopFormData.name} onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (KSh) *</Label>
                        <Input type="number" value={shopFormData.price} onChange={(e) => setShopFormData({ ...shopFormData, price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={shopFormData.description} onChange={(e) => setShopFormData({ ...shopFormData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={shopFormData.category} onValueChange={(v) => setShopFormData({ ...shopFormData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="food">Food Items</SelectItem>
                            <SelectItem value="toiletries">Toiletries</SelectItem>
                            <SelectItem value="sanitary">Sanitary</SelectItem>
                            <SelectItem value="household">Household</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input value={shopFormData.brand} onChange={(e) => setShopFormData({ ...shopFormData, brand: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input type="number" value={shopFormData.stock_quantity} onChange={(e) => setShopFormData({ ...shopFormData, stock_quantity: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input value={shopFormData.image_url} onChange={(e) => setShopFormData({ ...shopFormData, image_url: e.target.value })} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={shopFormData.is_available} onCheckedChange={(c) => setShopFormData({ ...shopFormData, is_available: c })} />
                      <Label>Available</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveShopItem.isPending}>
                      {saveShopItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingShopId ? 'Update Item' : 'Add Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {shopLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4">
                {shopItems?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🛒</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                              <Badge variant="outline">{item.stock_quantity} in stock</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{item.category} {item.brand && `• ${item.brand}`}</p>
                            <p className="font-medium text-primary">KSh {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditShop(item)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteShopItem.mutate(item.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ SPIRITS TAB ============ */}
          <TabsContent value="spirits" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Spirits Items ({spiritsItems?.length || 0})</h2>
              <Dialog open={spiritsDialogOpen} onOpenChange={setSpiritsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSpiritsFormData(emptySpiritsForm); setEditingSpiritsId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSpiritsId ? 'Edit Spirits Item' : 'Add Spirits Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSpiritsSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={spiritsFormData.name} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (KSh) *</Label>
                        <Input type="number" value={spiritsFormData.price} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={spiritsFormData.description} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={spiritsFormData.category} onValueChange={(v) => setSpiritsFormData({ ...spiritsFormData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beer">Beer</SelectItem>
                            <SelectItem value="whiskey">Whiskey</SelectItem>
                            <SelectItem value="vodka">Vodka</SelectItem>
                            <SelectItem value="wine">Wine</SelectItem>
                            <SelectItem value="spirits">Spirits</SelectItem>
                            <SelectItem value="rum">Rum</SelectItem>
                            <SelectItem value="cognac">Cognac</SelectItem>
                            <SelectItem value="liqueur">Liqueur</SelectItem>
                            <SelectItem value="rtd">RTD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input value={spiritsFormData.brand} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, brand: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Volume</Label>
                        <Input value={spiritsFormData.volume} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, volume: e.target.value })} placeholder="750ml" />
                      </div>
                      <div className="space-y-2">
                        <Label>Alcohol %</Label>
                        <Input type="number" step="0.1" value={spiritsFormData.alcohol_percentage} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, alcohol_percentage: e.target.value })} placeholder="40" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input type="number" value={spiritsFormData.stock_quantity} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, stock_quantity: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input value={spiritsFormData.image_url} onChange={(e) => setSpiritsFormData({ ...spiritsFormData, image_url: e.target.value })} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={spiritsFormData.is_available} onCheckedChange={(c) => setSpiritsFormData({ ...spiritsFormData, is_available: c })} />
                      <Label>Available</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveSpiritsItem.isPending}>
                      {saveSpiritsItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingSpiritsId ? 'Update Item' : 'Add Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {spiritsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4">
                {spiritsItems?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍺</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                              <Badge variant="outline">{item.stock_quantity} in stock</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{item.category} {item.brand && `• ${item.brand}`} {item.volume && `• ${item.volume}`}</p>
                            <p className="font-medium text-primary">KSh {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditSpirits(item)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSpiritsItem.mutate(item.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ ORDERS TAB ============ */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-bold">Orders ({orders?.length || 0})</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : orders?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No orders yet</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {orders?.map((order: any) => {
                  // Extract transaction code from notes
                  const paystackMatch = order.notes?.match(/Paystack:\s*([A-Za-z0-9_-]+)/i);
                  const mpesaMatch = order.notes?.match(/M-Pesa:\s*([A-Z0-9]+)/i);
                  const transactionCode = paystackMatch ? paystackMatch[1] : (mpesaMatch ? mpesaMatch[1] : null);
                  const phoneMatch = order.notes?.match(/Phone:\s*(\+?\d+)/);
                  const customerPhone = phoneMatch ? phoneMatch[1] : order.profiles?.phone;
                  
                  return (
                  <Card key={order.id} className={order.payment_status === 'paid' ? 'border-green-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                            <p className="font-semibold">{order.profiles?.full_name || 'Guest'}</p>
                            <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                            {customerPhone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />{customerPhone}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-1 justify-end mb-1">
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              <Badge className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                                {order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                              </Badge>
                            </div>
                            <p className="font-bold text-lg">KSh {order.total_amount.toLocaleString()}</p>
                            {transactionCode && (
                              <p className="text-xs text-green-600 font-mono">Ref: {transactionCode}</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 border border-primary/10">
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">📦 Items Ordered ({order.order_items?.length || 0}):</p>
                          {order.order_items && order.order_items.length > 0 ? (
                            <ul className="text-sm space-y-1.5">
                              {order.order_items.map((item: any) => (
                                <li key={item.id} className="flex justify-between items-center bg-background/60 rounded px-2 py-1">
                                  <span className="font-medium text-foreground">• {item.quantity}x {item.item_name}</span>
                                  <span className="text-primary font-bold">KSh {(item.unit_price * item.quantity).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">⚠️ Items not yet loaded — they will appear shortly</p>
                          )}
                        </div>
                        {order.delivery_address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{order.delivery_address}</span>
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Select 
                            value={order.status} 
                            onValueChange={(status) => updateOrderStatus.mutate({ 
                              id: order.id, 
                              status, 
                              customerEmail: order.profiles?.email, 
                              customerName: order.profiles?.full_name,
                              paymentStatus: order.payment_status,
                              transactionCode,
                            })}
                          >
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="delivering">Delivering</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          {riders && riders.length > 0 && !order.rider_id && (
                            <Select onValueChange={(riderId) => {
                              const selectedRider = riders.find((r: any) => r.id === riderId);
                              assignRider.mutate({ 
                                orderId: order.id, 
                                riderId,
                                order,
                                riderInfo: selectedRider ? {
                                  email: selectedRider.profiles?.email || '',
                                  name: selectedRider.profiles?.full_name || selectedRider.phone,
                                } : undefined,
                              });
                            }}>
                              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Assign Rider" /></SelectTrigger>
                              <SelectContent>
                                {riders.map((rider: any) => (
                                  <SelectItem key={rider.id} value={rider.id}>
                                    {rider.profiles?.full_name || rider.phone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {order.rider_id && (
                            <Badge variant="outline" className="bg-blue-50">
                              <Bike className="h-3 w-3 mr-1" />
                              Rider Assigned
                            </Badge>
                          )}
                          {order.profiles?.email && (
                            <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${order.profiles.email}`)}>
                              <Mail className="h-4 w-4 mr-1" />Email
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ============ RESERVATIONS TAB ============ */}
          <TabsContent value="reservations" className="space-y-4">
            <h2 className="text-2xl font-bold">Reservations ({reservations?.length || 0})</h2>
            {reservationsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : reservations?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No reservations yet</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {reservations?.map((res) => (
                  <Card key={res.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{res.guest_name}</p>
                          <p className="text-sm text-muted-foreground">{res.guest_email}</p>
                          {res.guest_phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{res.guest_phone}</p>}
                          <div className="mt-2 flex gap-4 text-sm">
                            <span>📅 {format(new Date(res.reservation_date), 'MMM d, yyyy')}</span>
                            <span>🕐 {res.reservation_time}</span>
                            <span>👥 {res.number_of_guests} guests</span>
                          </div>
                          {res.special_requests && <p className="text-sm mt-2 italic">"{res.special_requests}"</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(res.status || 'pending')}>{res.status}</Badge>
                          <Select value={res.status || 'pending'} onValueChange={(status) => updateReservationStatus.mutate({ id: res.id, status, guestEmail: res.guest_email, guestName: res.guest_name })}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${res.guest_email}`)}>
                            <Mail className="h-4 w-4 mr-1" />Email
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ SPECIALS TAB ============ */}
          <TabsContent value="specials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Weekly Specials</h2>
              <Dialog open={specialDialogOpen} onOpenChange={setSpecialDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSpecialFormData(emptySpecialForm); setEditingSpecialId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Special
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editingSpecialId ? 'Edit Special' : 'Add Special'}</DialogTitle></DialogHeader>
                  <form onSubmit={handleSpecialSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select 
                        value={specialFormData.item_source} 
                        onValueChange={(v: 'food' | 'grocery' | 'shop' | 'spirits') => setSpecialFormData({ ...specialFormData, item_source: v, menu_item_id: '', menu_item_name: '', original_price: '', discounted_price: '' })}
                      >
                        <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">🍽️ Food Menu</SelectItem>
                          <SelectItem value="grocery">🥬 Grocery</SelectItem>
                          <SelectItem value="shop">🏪 Shop</SelectItem>
                          <SelectItem value="spirits">🍾 Spirits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Item *</Label>
                      <Select value={specialFormData.menu_item_id} onValueChange={(id) => handleItemSelectForSpecial(id, specialFormData.item_source)}>
                        <SelectTrigger><SelectValue placeholder="Choose an item" /></SelectTrigger>
                        <SelectContent>
                          {specialFormData.item_source === 'food' && menuItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name} - KSh {item.price.toLocaleString()}</SelectItem>
                          ))}
                          {specialFormData.item_source === 'grocery' && groceryItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name} - KSh {item.price.toLocaleString()}</SelectItem>
                          ))}
                          {specialFormData.item_source === 'shop' && shopItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name} - KSh {item.price.toLocaleString()}</SelectItem>
                          ))}
                          {specialFormData.item_source === 'spirits' && spiritsItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name} - KSh {item.price.toLocaleString()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Original Price</Label><Input type="number" value={specialFormData.original_price} disabled className="bg-muted" /></div>
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Select value={specialFormData.discount_percentage} onValueChange={handleDiscountChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={specialFormData.start_date} onChange={(e) => setSpecialFormData({ ...specialFormData, start_date: e.target.value })} /></div>
                      <div className="space-y-2"><Label>End Date</Label><Input type="date" value={specialFormData.end_date} onChange={(e) => setSpecialFormData({ ...specialFormData, end_date: e.target.value })} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={specialFormData.is_active} onCheckedChange={(c) => setSpecialFormData({ ...specialFormData, is_active: c })} />
                      <Label>Active</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveWeeklySpecial.isPending}>
                      {saveWeeklySpecial.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingSpecialId ? 'Update' : 'Create'} Special
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {specialsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : weeklySpecials?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No weekly specials</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {weeklySpecials?.map((special) => (
                  <Card key={special.id} className={!special.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{special.menu_item_name}</h3>
                            {special.is_active ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="line-through text-muted-foreground">KSh {special.original_price.toLocaleString()}</span>
                            <span className="font-bold text-primary">KSh {special.discounted_price.toLocaleString()}</span>
                            <Badge variant="outline" className="text-green-600">-{special.discount_percentage}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{format(new Date(special.start_date), 'MMM d')} - {format(new Date(special.end_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => { setSpecialFormData({ menu_item_id: special.menu_item_id, menu_item_name: special.menu_item_name, original_price: special.original_price.toString(), discount_percentage: special.discount_percentage.toString(), discounted_price: special.discounted_price.toString(), start_date: special.start_date, end_date: special.end_date, is_active: special.is_active, item_source: 'food' }); setEditingSpecialId(special.id); setSpecialDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => deleteWeeklySpecial.mutate(special.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ LOYALTY TAB ============ */}
          <TabsContent value="loyalty" className="space-y-6">
            <h2 className="text-2xl font-bold">Loyalty Program</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><span className="text-2xl font-bold">{loyaltyData?.length || 0}</span></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Points Earned</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /><span className="text-2xl font-bold">{loyaltyData?.reduce((sum: number, l: any) => sum + (l.total_earned || 0), 0).toLocaleString() || 0}</span></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Points Redeemed</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold">{loyaltyData?.reduce((sum: number, l: any) => sum + (l.total_redeemed || 0), 0).toLocaleString() || 0}</span></div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Member Points</CardTitle></CardHeader>
              <CardContent>
                {loyaltyLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : loyaltyData?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No loyalty members yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Earned</TableHead>
                        <TableHead className="text-right">Redeemed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyaltyData?.map((loyalty: any) => (
                        <TableRow key={loyalty.id}>
                          <TableCell className="font-medium">{loyalty.profiles?.full_name || 'Unknown'}</TableCell>
                          <TableCell>{loyalty.profiles?.email || '-'}</TableCell>
                          <TableCell className="text-right"><Badge variant="outline">{loyalty.points.toLocaleString()}</Badge></TableCell>
                          <TableCell className="text-right text-green-600">+{loyalty.total_earned.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-orange-600">-{loyalty.total_redeemed.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ RIDERS TAB ============ */}
          <TabsContent value="riders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Delivery Riders ({riders?.length || 0})</h2>
              <Dialog open={addRiderDialogOpen} onOpenChange={setAddRiderDialogOpen}>
                <DialogTrigger asChild>
                  <Button><UserPlus className="h-4 w-4 mr-2" />Add Rider</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Rider</DialogTitle>
                    <DialogDescription>Enter the email and phone of a registered user to make them a rider.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>User Email</Label>
                      <Input type="email" value={newRiderEmail} onChange={(e) => setNewRiderEmail(e.target.value)} placeholder="rider@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" value={newRiderPhone} onChange={(e) => setNewRiderPhone(e.target.value)} placeholder="+254700000000" />
                    </div>
                    <Button className="w-full" onClick={() => addRider.mutate({ email: newRiderEmail, phone: newRiderPhone })} disabled={addRider.isPending || !newRiderEmail || !newRiderPhone}>
                      {addRider.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Add Rider
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {ridersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : riders?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No riders yet. Add riders to enable delivery assignments.</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {riders?.map((rider: any) => (
                  <Card key={rider.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bike className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{rider.profiles?.full_name || 'Rider'}</h3>
                            <p className="text-sm text-muted-foreground">{rider.profiles?.email}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{rider.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={rider.is_available ? 'bg-green-500' : 'bg-gray-500'}>
                            {rider.is_available ? 'Online' : 'Offline'}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Rider?</AlertDialogTitle>
                                <AlertDialogDescription>This will remove rider access for {rider.profiles?.full_name || 'this user'}.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeRider.mutate({ riderId: rider.id, userId: rider.user_id })}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ ADMINS TAB ============ */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Management ({adminUsers?.length || 0})</h2>
              <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button><UserPlus className="h-4 w-4 mr-2" />Add Admin</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>Enter the email of a registered user to grant admin access.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>User Email</Label>
                      <Input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="user@email.com" />
                    </div>
                    <Button className="w-full" onClick={() => addAdmin.mutate(newAdminEmail)} disabled={addAdmin.isPending || !newAdminEmail}>
                      {addAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Add Admin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {adminsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4">
                {adminUsers?.map((admin: any) => (
                  <Card key={admin.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{admin.profiles?.full_name || 'Admin'}</h3>
                            <p className="text-sm text-muted-foreground">{admin.profiles?.email}</p>
                          </div>
                        </div>
                        {admin.user_id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin?</AlertDialogTitle>
                                <AlertDialogDescription>This will revoke admin access for {admin.profiles?.full_name || 'this user'}.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeAdmin.mutate(admin.user_id)}>Remove</AlertDialogAction>
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

          {/* ============ FINANCE TAB ============ */}
          <TabsContent value="finance" className="space-y-4">
            <FinanceSection />
          </TabsContent>

          {/* ============ INVENTORY TAB ============ */}
          <TabsContent value="inventory" className="space-y-4">
            <h2 className="text-2xl font-bold">Inventory Alerts</h2>
            <InventoryAlerts 
              groceryItems={(groceryItems || []).map(item => ({
                id: item.id,
                name: item.name,
                stock_quantity: item.stock_quantity,
                category: item.category,
                type: 'grocery' as const
              }))}
              shopItems={(shopItems || []).map(item => ({
                id: item.id,
                name: item.name,
                stock_quantity: item.stock_quantity,
                category: item.category,
                type: 'shop' as const
              }))}
              spiritsItems={(spiritsItems || []).map(item => ({
                id: item.id,
                name: item.name,
                stock_quantity: item.stock_quantity,
                category: item.category,
                type: 'spirits' as const
              }))}
              onRestock={(item) => {
                toast.info(`Navigate to ${item.type} tab to restock ${item.name}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;