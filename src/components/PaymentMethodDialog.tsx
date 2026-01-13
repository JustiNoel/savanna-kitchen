import { useState } from 'react';
import { CreditCard, Smartphone, Wallet, Banknote, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (method: string) => void;
  isLoading?: boolean;
  totalAmount: number;
}

const paymentMethods = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Pay via M-Pesa mobile money',
    icon: Smartphone,
    color: 'text-green-600',
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Banknote,
    color: 'text-amber-600',
  },
  {
    id: 'card',
    name: 'Card Payment',
    description: 'Visa, Mastercard, or other cards',
    icon: CreditCard,
    color: 'text-blue-600',
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money Transfer',
    description: 'Airtel Money, T-Kash, etc.',
    icon: Wallet,
    color: 'text-purple-600',
  },
];

const PaymentMethodDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  totalAmount,
}: PaymentMethodDialogProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('mpesa');

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Choose Payment Method</DialogTitle>
          <DialogDescription>
            Select how you'd like to pay for your order of {formatPrice(totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedMethod}
          onValueChange={setSelectedMethod}
          className="space-y-3 mt-4"
        >
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Label
                key={method.id}
                htmlFor={method.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                <div className={`p-2 rounded-full bg-muted ${method.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <div className="h-3 w-3 rounded-full bg-primary" />
                )}
              </Label>
            );
          })}
        </RadioGroup>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedMethod)}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Confirm Order'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;
