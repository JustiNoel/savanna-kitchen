import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSectionProps {
  totalAmount: number;
  onPaymentConfirmed: (transactionCode: string) => void;
  isConfirmed: boolean;
  phoneNumber?: string;
}

const PaymentSection = ({ totalAmount, onPaymentConfirmed, isConfirmed, phoneNumber }: PaymentSectionProps) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

  const handlePaystackPayment = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    const reference = `GRB-${Date.now()}`;

    try {
      toast.loading('Initializing payment...', { id: 'paystack-init' });

      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email,
          amount: totalAmount,
          reference,
          metadata: { phone: phoneNumber || '', source: 'grabbys-kitchen' },
        },
      });

      toast.dismiss('paystack-init');

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to initialize payment');

      // Open Paystack checkout in a new window
      const paystackWindow = window.open(data.authorization_url, '_blank', 'width=600,height=700');

      toast.info('Complete payment in the Paystack window, then click "I Have Paid" below.', { duration: 10000 });

      // Store reference for verification
      setIsProcessing(false);
      
      // Listen for window close or user confirmation
      const checkInterval = setInterval(() => {
        if (paystackWindow?.closed) {
          clearInterval(checkInterval);
        }
      }, 1000);

      // We'll let the user confirm manually via button
      (window as any).__paystack_ref = data.reference;

    } catch (err) {
      toast.dismiss('paystack-init');
      console.error('Paystack error:', err);
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirmation = () => {
    const ref = (window as any).__paystack_ref;
    if (ref) {
      onPaymentConfirmed(ref);
      delete (window as any).__paystack_ref;
      toast.success('Payment confirmed! ✅ Order is being submitted...', { duration: 3000 });
    } else {
      toast.error('Please initiate payment first');
    }
  };

  if (isConfirmed) {
    return (
      <Card className="border-green-500/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </motion.div>
            <h3 className="font-display text-xl font-bold text-green-700 dark:text-green-300">
              Payment Received! ✅
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              Your order is being prepared for delivery
            </p>
            <div className="bg-green-200 dark:bg-green-800/50 rounded-lg p-3 mt-2">
              <p className="text-xs text-green-700 dark:text-green-300 text-center font-medium">
                ⏱️ Estimated delivery: ~5 minutes
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const hasRef = !!(window as any).__paystack_ref;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-green-50 dark:to-green-950/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-green-600" />
          Pay via Paystack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl text-center">
          <p className="text-sm opacity-90">Amount to Pay</p>
          <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., you@example.com"
            className="text-base"
            type="email"
          />
          <p className="text-xs text-muted-foreground">
            Paystack will send a receipt to this email
          </p>
        </div>

        {/* How it works */}
        <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-lg">
          <p className="font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            How it works:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>Enter your email and click "Pay Now"</li>
            <li>Complete payment in the Paystack window (card, M-Pesa, etc.)</li>
            <li>Click "I Have Paid" to confirm</li>
          </ol>
        </div>

        {/* Notice */}
        <div className="bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Amount: <strong>{formatPrice(totalAmount)}</strong> — Paystack supports cards, M-Pesa & more
          </p>
        </div>

        {/* Pay Button */}
        {!hasRef ? (
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={handlePaystackPayment}
            disabled={isProcessing || !email.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Initializing...
              </>
            ) : (
              <>
                <CreditCard className="h-6 w-6 mr-2" />
                Pay {formatPrice(totalAmount)} Now
              </>
            )}
          </Button>
        ) : (
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={handlePaymentConfirmation}
          >
            <CheckCircle2 className="h-6 w-6 mr-2" />
            I Have Paid
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Secure payment via Paystack 🔒
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
