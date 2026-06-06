import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Loader2, AlertCircle, ShieldCheck, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/context/AuthContext';

interface PaymentSectionProps {
  totalAmount: number;
  onPaymentConfirmed: (transactionCode: string) => void;
  isConfirmed: boolean;
  phoneNumber?: string;
}

const PaymentSection = ({ totalAmount, onPaymentConfirmed, isConfirmed, phoneNumber }: PaymentSectionProps) => {
  const { isAdmin } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const maintenanceLocked = appSettings.maintenance_mode && !isAdmin;
  const MAINTENANCE_MESSAGE = appSettings.maintenance_message;
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const verifyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paystackWindowRef = useRef<Window | null>(null);

  const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

  const verifyPayment = useCallback(async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference },
      });

      if (error) throw error;

      if (data?.success && data?.verified) {
        // Payment verified successfully!
        setIsVerifying(false);
        if (verifyIntervalRef.current) {
          clearInterval(verifyIntervalRef.current);
          verifyIntervalRef.current = null;
        }
        toast.success('Payment verified successfully! ✅', { duration: 3000 });
        onPaymentConfirmed(reference);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  }, [onPaymentConfirmed]);

  // Start polling for payment verification
  const startVerification = useCallback((reference: string) => {
    setIsVerifying(true);
    setPaymentReference(reference);

    // Poll every 3 seconds
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max

    verifyIntervalRef.current = setInterval(async () => {
      attempts++;
      
      const verified = await verifyPayment(reference);
      
      if (verified || attempts >= maxAttempts) {
        if (verifyIntervalRef.current) {
          clearInterval(verifyIntervalRef.current);
          verifyIntervalRef.current = null;
        }
        if (!verified && attempts >= maxAttempts) {
          setIsVerifying(false);
          toast.error('Payment verification timed out. Use "Verify Payment" button if you completed payment.');
        }
      }
    }, 3000);
  }, [verifyPayment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
      }
    };
  }, []);

  const handlePaystackPayment = async () => {
    if (maintenanceLocked) {
      toast.error('Payments are temporarily disabled — system under maintenance.');
      return;
    }
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

      // Open Paystack checkout
      paystackWindowRef.current = window.open(data.authorization_url, '_blank', 'width=600,height=700');
      
      setIsProcessing(false);

      // Start auto-verification polling
      startVerification(data.reference);

      toast.info('Complete payment in the Paystack window. We\'ll verify automatically!', { duration: 8000 });

    } catch (err) {
      toast.dismiss('paystack-init');
      console.error('Paystack error:', err);
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsProcessing(false);
    }
  };

  const handleManualVerify = async () => {
    if (!paymentReference) {
      toast.error('No payment to verify. Please initiate payment first.');
      return;
    }
    setIsVerifying(true);
    const verified = await verifyPayment(paymentReference);
    if (!verified) {
      setIsVerifying(false);
      toast.error('Payment not yet confirmed. Please complete payment in the Paystack window.');
    }
  };

  if (maintenanceLocked) {
    return (
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
            <Wrench className="h-5 w-5" />
            Payments Temporarily Disabled
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {MAINTENANCE_MESSAGE}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Please do not attempt to pay — no order will be placed. We'll notify you as soon as the system is back online. 🛠️
          </p>
        </CardContent>
      </Card>
    );
  }

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
              Payment Verified! ✅
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              Your payment has been confirmed. Order is being submitted!
            </p>
            <div className="bg-green-200 dark:bg-green-800/50 rounded-lg p-3 mt-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-700 dark:text-green-300" />
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                Server-verified secure payment
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

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
            disabled={isVerifying}
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
            <li>Payment is automatically verified — no extra steps!</li>
          </ol>
        </div>

        {/* Verifying State */}
        {isVerifying && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Waiting for payment confirmation...
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Complete payment in the Paystack window. We'll detect it automatically.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notice */}
        <div className="bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Amount: <strong>{formatPrice(totalAmount)}</strong> — Paystack supports cards, M-Pesa & more
          </p>
        </div>

        {/* Pay / Verify Buttons */}
        {!isVerifying && !paymentReference ? (
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
        ) : !isVerifying && paymentReference ? (
          <div className="space-y-2">
            <Button
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              onClick={handleManualVerify}
            >
              <ShieldCheck className="h-6 w-6 mr-2" />
              Verify Payment
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Click to check if your payment went through
            </p>
          </div>
        ) : null}

        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Secure payment with server-side verification 🔒
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
