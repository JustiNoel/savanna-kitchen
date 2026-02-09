import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAddLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getImageForDish } from '@/lib/foodImages';
import { supabase } from '@/integrations/supabase/client';
import LocationPicker from './LocationPicker';
import PaymentSection from './PaymentSection';

interface DeliveryLocation {
  address: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  phoneNumber?: string;
}

const CartSheet = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const addPoints = useAddLoyaltyPoints();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionCode, setTransactionCode] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const DELIVERY_FEE = 20; // Flat delivery fee in KSh
  const totalWithFee = totalPrice + DELIVERY_FEE;

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const sendOrderNotification = async (orderId: string, customerEmail: string, customerName: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'order',
          customerEmail,
          customerName,
          details: {
            orderId,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: totalWithFee,
            transactionCode,
            deliveryAddress: deliveryLocation?.address,
            phoneNumber: deliveryLocation?.phoneNumber,
          },
        },
      });
      
      if (error) {
        console.error('Failed to send notification:', error);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handlePaymentConfirmed = async (code: string) => {
    setTransactionCode(code);
    setPaymentConfirmed(true);
    
    // Automatically place the order after payment is confirmed
    await placeOrder(code);
  };

  const placeOrder = async (code: string) => {
    if (!user || !deliveryLocation) return;

    setIsProcessing(true);
    try {
      // Create the order with payment info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalWithFee,
          status: 'pending',
          payment_status: 'paid',
          payment_method: 'mpesa',
          delivery_address: deliveryLocation.address,
          delivery_latitude: deliveryLocation.latitude,
          delivery_longitude: deliveryLocation.longitude,
          delivery_instructions: deliveryLocation.instructions || null,
          notes: `Paystack: ${code}${deliveryLocation.phoneNumber ? ` | Phone: ${deliveryLocation.phoneNumber}` : ''}`,
          order_type: 'delivery',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Record payment in financial_transactions
      await supabase.from('financial_transactions').insert({
        order_id: order.id,
        type: 'income',
        category: 'order_payment',
        amount: totalWithFee,
        description: `Order #${order.id.slice(0, 8)} - M-Pesa Payment`,
        payment_method: 'mpesa',
        reference_number: code,
        created_by: user.id,
      });
      
      // Award loyalty points (1 point per KSh 10 spent)
      const pointsEarned = Math.floor(totalPrice / 10);
      if (pointsEarned > 0) {
        try {
          await addPoints.mutateAsync({
            points: pointsEarned,
            source: 'order',
            referenceId: order.id,
            description: `Earned ${pointsEarned} points from order`,
          });
        } catch (pointsError) {
          console.error('Failed to add loyalty points:', pointsError);
        }
      }
      
      // Send email notification
      await sendOrderNotification(
        order.id,
        user.email || '',
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
      );
      
      setOrderPlaced(true);
      toast.success('Order placed successfully! 🎉', {
        description: `Your order is being prepared. You earned ${pointsEarned} loyalty points!`,
        duration: 5000,
      });
      
      // Clear cart after a short delay to show success state
      setTimeout(() => {
        clearCart();
        setDeliveryLocation(null);
        setPaymentConfirmed(false);
        setTransactionCode('');
        setOrderPlaced(false);
      }, 3000);
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
      setPaymentConfirmed(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground text-center">
          Add some delicious items to get started!
        </p>
      </div>
    );
  }

  // Show success state
  if (orderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="relative">
          <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
          <div className="relative bg-green-500 rounded-full p-6">
            <ShoppingBag className="h-12 w-12 text-white" />
          </div>
        </div>
        <h3 className="font-display text-2xl font-bold text-green-600 mt-6 mb-2">Order Confirmed! 🎉</h3>
        <p className="text-muted-foreground text-center max-w-xs">
          Your order is being prepared and will be delivered soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-4">
        <SheetTitle className="font-display text-2xl">Your Order</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {items.map((item) => {
          const imageUrl = getImageForDish(item.name);
          return (
            <div key={item.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  '🍽️'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                <p className="text-primary font-medium text-sm">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={paymentConfirmed}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium w-6 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={paymentConfirmed}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                    disabled={paymentConfirmed}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Step 1: Location Picker */}
        {user && (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${deliveryLocation ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                1
              </div>
              <span className="font-medium">Delivery Location</span>
            </div>
            <LocationPicker onLocationSelect={setDeliveryLocation} />
          </div>
        )}

        {/* Step 2: Payment Section - Only show after location is set */}
        {user && deliveryLocation && (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${paymentConfirmed ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
            <PaymentSection 
              totalAmount={totalWithFee} 
              onPaymentConfirmed={handlePaymentConfirmed}
              isConfirmed={paymentConfirmed}
              phoneNumber={deliveryLocation?.phoneNumber}
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee 🚚</span>
            <span>{formatPrice(DELIVERY_FEE)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(totalWithFee)}</span>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Processing your order...</span>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearCart}
          disabled={paymentConfirmed || isProcessing}
        >
          Clear Cart
        </Button>

        {!user && (
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              You'll need to sign in to complete your order
            </p>
            <SheetClose asChild>
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </SheetClose>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSheet;
