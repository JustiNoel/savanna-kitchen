import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAddLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getImageForDish } from '@/lib/foodImages';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodDialog from './PaymentMethodDialog';

const CartSheet = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const addPoints = useAddLoyaltyPoints();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const sendOrderNotification = async (orderId: string, customerEmail: string, customerName: string, paymentMethod: string) => {
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
            totalAmount: Math.round(totalPrice * 1.1),
            paymentMethod,
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

  const handleCheckoutClick = () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleConfirmOrder = async (paymentMethod: string) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: Math.round(totalPrice * 1.1),
        paymentMethod,
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
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        paymentMethod
      );
      
      clearCart();
      setShowPaymentDialog(false);
      toast.success('Order placed successfully!', {
        description: `Payment method: ${paymentMethod.replace('_', ' ').toUpperCase()}. You earned ${pointsEarned} loyalty points!`,
      });
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
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
          Add some delicious Kenyan dishes to get started!
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
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium w-6 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service Fee (10%)</span>
            <span>{formatPrice(Math.round(totalPrice * 0.1))}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(Math.round(totalPrice * 1.1))}</span>
          </div>
        </div>

        <div className="space-y-2">
          <SheetClose asChild>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCheckoutClick}
              disabled={createOrder.isPending || isProcessing}
            >
              {createOrder.isPending || isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </SheetClose>
          <Button variant="outline" className="w-full" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>

        {!user && (
          <p className="text-center text-xs text-muted-foreground">
            You'll need to sign in to complete your order
          </p>
        )}
      </div>

      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onConfirm={handleConfirmOrder}
        isLoading={isProcessing}
        totalAmount={Math.round(totalPrice * 1.1)}
      />
    </div>
  );
};

export default CartSheet;
