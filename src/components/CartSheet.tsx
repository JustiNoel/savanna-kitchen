import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getImageForDish } from '@/lib/foodImages';

const CartSheet = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    try {
      await createOrder.mutateAsync({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: Math.round(totalPrice * 1.1), // Including service fee
      });
      
      clearCart();
      toast.success('Order placed successfully!', {
        description: 'You can track your order in your profile.',
      });
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
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
              onClick={handleCheckout}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Placing Order...
                </>
              ) : (
                'Place Order'
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
    </div>
  );
};

export default CartSheet;
