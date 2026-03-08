import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface OrderRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onRated?: () => void;
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="p-0.5">
          <Star
            className={`h-7 w-7 transition-colors ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
          />
        </button>
      ))}
    </div>
  </div>
);

const OrderRatingDialog = ({ open, onOpenChange, orderId, onRated }: OrderRatingDialogProps) => {
  const { user } = useAuth();
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || foodRating === 0 || deliveryRating === 0) {
      toast.error('Please rate both food and delivery');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('order_ratings').insert({
      order_id: orderId,
      user_id: user.id,
      food_rating: foodRating,
      delivery_rating: deliveryRating,
      comment: comment || null,
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'You already rated this order' : 'Failed to submit rating');
    } else {
      toast.success('Thanks for your feedback! 🌟');
      onOpenChange(false);
      setFoodRating(0);
      setDeliveryRating(0);
      setComment('');
      onRated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
          <DialogDescription>How was your experience?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <StarRating value={foodRating} onChange={setFoodRating} label="🍽️ Food Quality" />
          <StarRating value={deliveryRating} onChange={setDeliveryRating} label="🚚 Delivery Experience" />
          <Textarea
            placeholder="Any comments? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || foodRating === 0 || deliveryRating === 0}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderRatingDialog;
