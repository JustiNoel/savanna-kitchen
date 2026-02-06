import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, CreditCard, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSectionProps {
  totalAmount: number;
  onPaymentConfirmed: (transactionCode: string) => void;
  isConfirmed: boolean;
  phoneNumber?: string;
}

const PaymentSection = ({ totalAmount, onPaymentConfirmed, isConfirmed, phoneNumber: initialPhone }: PaymentSectionProps) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [pinEntered, setPinEntered] = useState(false);

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = formatPhoneNumber(phone);
    return cleaned.length === 9 && /^[17]\d{8}$/.test(cleaned);
  };

  const initiateSTKPush = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid Safaricom phone number (e.g., 0712345678)');
      return;
    }

    setIsProcessing(true);
    const reference = `GRB-${Date.now()}`;

    try {
      toast.loading('Sending M-Pesa payment request...', { id: 'stk-push' });

      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: phoneNumber,
          amount: totalAmount,
          reference: reference,
          description: `Grabbys Kitchen Order - ${formatPrice(totalAmount)}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setTransactionId(data.transactionId || reference);
        setShowPinPrompt(true);
        toast.dismiss('stk-push');
        toast.success('M-Pesa payment request sent! Check your phone.', {
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment');
      }
    } catch (error) {
      console.error('STK Push error:', error);
      toast.dismiss('stk-push');
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinConfirmation = () => {
    setPinEntered(true);
    setShowPinPrompt(false);

    let countdown = 5;
    toast.info(`Verifying payment... ${countdown}s`, { id: 'payment-verification' });

    const verificationInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        toast.info(`Verifying payment... ${countdown}s`, { id: 'payment-verification' });
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(verificationInterval);
      toast.dismiss('payment-verification');
      onPaymentConfirmed(transactionId);
      toast.success('Payment verified! ✅ Order is being submitted...', { duration: 3000 });
    }, 5000);
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

  return (
    <>
      {/* M-Pesa PIN Entry Prompt Dialog */}
      <Dialog open={showPinPrompt} onOpenChange={setShowPinPrompt}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-b from-green-600 to-green-700 text-white p-6">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <DialogTitle className="text-white text-xl font-bold">M-Pesa Payment</DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-4 text-center">
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm opacity-80">Pay EXACT Amount</p>
                <p className="text-4xl font-bold mt-1">{formatPrice(totalAmount)}</p>
              </div>

              <div className="bg-white/20 rounded-lg p-4 text-left space-y-2">
                <p className="font-medium text-center">📱 Check Your Phone</p>
                <p className="text-sm opacity-90">
                  An M-Pesa payment prompt has been sent to your phone.
                  Enter your M-Pesa PIN to authorize the payment.
                </p>
              </div>

              <div className="bg-yellow-500/30 border border-yellow-300/50 rounded-lg p-3 text-sm">
                <p className="font-medium">⚠️ Do NOT share your M-Pesa PIN!</p>
                <p className="text-xs opacity-80 mt-1">Safaricom will never ask for your PIN via call or SMS</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              After entering your M-Pesa PIN on your phone, click confirm below
            </p>
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              onClick={handlePinConfirmation}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              I Have Entered My PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-primary/20 bg-gradient-to-br from-background to-green-50 dark:to-green-950/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-green-600" />
            Pay via M-Pesa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Details */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl space-y-3">
            <div className="text-center">
              <p className="text-sm opacity-90">Amount to Pay</p>
              <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
            </div>

            <div className="bg-white/20 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-center">Lipa Na M-Pesa (Paybill)</p>
              <p className="text-xs text-center opacity-80">
                Payment will be sent via STK Push — you'll receive a prompt on your phone
              </p>
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone-number">Safaricom Phone Number</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 0712345678"
              className="text-base font-mono tracking-wider"
              maxLength={13}
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Enter the phone number registered with M-Pesa
            </p>
          </div>

          {/* How it works */}
          <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-lg">
            <p className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              How it works:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>Click "Pay Now" button below</li>
              <li>You'll receive an M-Pesa prompt on your phone</li>
              <li>Enter your M-Pesa PIN to authorize</li>
              <li>Payment is automatically confirmed</li>
            </ol>
          </div>

          {/* Strict Payment Notice */}
          <div className="bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium text-center flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pay the <strong>EXACT amount ({formatPrice(totalAmount)})</strong>
            </p>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={initiateSTKPush}
            disabled={isProcessing || !phoneNumber.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Sending M-Pesa Request...
              </>
            ) : (
              <>
                <Smartphone className="h-6 w-6 mr-2" />
                Pay {formatPrice(totalAmount)} Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment via Safaricom M-Pesa
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default PaymentSection;
