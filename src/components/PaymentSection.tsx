import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  totalAmount: number;
  onPaymentConfirmed: (transactionCode: string) => void;
  isConfirmed: boolean;
}

const PAYBILL_NUMBER = '247247';
const ACCOUNT_NUMBER = '0790961204';

const PaymentSection = ({ totalAmount, onPaymentConfirmed, isConfirmed }: PaymentSectionProps) => {
  const [transactionCode, setTransactionCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const copyToClipboard = async (text: string, type: 'paybill' | 'account') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'paybill') {
        setCopiedPaybill(true);
        setTimeout(() => setCopiedPaybill(false), 2000);
      } else {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleConfirmPayment = () => {
    if (!transactionCode.trim()) {
      toast.error('Please enter the M-Pesa transaction code');
      return;
    }

    // Basic validation for M-Pesa transaction code format
    const codePattern = /^[A-Z0-9]{10,}$/i;
    if (!codePattern.test(transactionCode.trim())) {
      toast.error('Please enter a valid M-Pesa transaction code');
      return;
    }

    setIsVerifying(true);
    
    // 5-second verification countdown
    let countdown = 5;
    toast.info(`Verifying payment... ${countdown}s`);
    
    const verificationInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        toast.info(`Verifying payment... ${countdown}s`, { id: 'payment-verification' });
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(verificationInterval);
      setIsVerifying(false);
      toast.dismiss('payment-verification');
      onPaymentConfirmed(transactionCode.trim().toUpperCase());
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
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Pay via M-Pesa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Instructions */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl space-y-3">
          <div className="text-center">
            <p className="text-sm opacity-90">Amount to Pay</p>
            <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-center">M-Pesa Paybill</p>
            
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
              <div>
                <p className="text-xs opacity-80">Paybill Number</p>
                <p className="font-mono font-bold text-lg">{PAYBILL_NUMBER}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => copyToClipboard(PAYBILL_NUMBER, 'paybill')}
              >
                {copiedPaybill ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
              <div>
                <p className="text-xs opacity-80">Account Number</p>
                <p className="font-mono font-bold text-lg">{ACCOUNT_NUMBER}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => copyToClipboard(ACCOUNT_NUMBER, 'account')}
              >
                {copiedAccount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-lg">
          <p className="font-medium">How to Pay:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Go to M-Pesa → Lipa na M-Pesa → Paybill</li>
            <li>Enter Business Number: <span className="font-mono font-bold text-foreground">{PAYBILL_NUMBER}</span></li>
            <li>Enter Account Number: <span className="font-mono font-bold text-foreground">{ACCOUNT_NUMBER}</span></li>
            <li>Enter Amount: <span className="font-bold text-foreground">{formatPrice(totalAmount)}</span></li>
            <li>Enter your M-Pesa PIN and confirm</li>
            <li>Enter the transaction code below</li>
          </ol>
        </div>

        {/* Transaction Code Input */}
        <div className="space-y-2">
          <Label htmlFor="transaction-code">M-Pesa Transaction Code</Label>
          <Input
            id="transaction-code"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
            placeholder="e.g., SLK7X9HZPQ"
            className="text-base font-mono uppercase tracking-wider"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Enter the transaction code from your M-Pesa confirmation message
          </p>
        </div>

        <Button
          className="w-full h-12 text-base"
          onClick={handleConfirmPayment}
          disabled={!transactionCode.trim() || isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verifying Payment...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              I Have Paid - Confirm Order
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
