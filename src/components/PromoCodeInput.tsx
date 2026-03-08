import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useValidatePromoCode } from '@/hooks/usePromoCodes';

interface PromoCodeInputProps {
  orderAmount: number;
  onApply: (discount: number, promoId: string, code: string) => void;
  onRemove: () => void;
  appliedCode: string | null;
  discount: number;
  disabled?: boolean;
}

const PromoCodeInput = ({ orderAmount, onApply, onRemove, appliedCode, discount, disabled }: PromoCodeInputProps) => {
  const [code, setCode] = useState('');
  const validatePromo = useValidatePromoCode();

  const handleApply = () => {
    if (!code.trim()) return;
    validatePromo.mutate(
      { code, orderAmount },
      {
        onSuccess: (result) => {
          onApply(result.discount, result.promo.id, result.promo.code);
          setCode('');
        },
      }
    );
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {appliedCode} — KSh {discount.toLocaleString()} off
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} disabled={disabled}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pl-9 h-9 text-sm"
            disabled={disabled}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button size="sm" variant="outline" onClick={handleApply} disabled={disabled || !code.trim() || validatePromo.isPending}>
          {validatePromo.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {validatePromo.isError && (
        <p className="text-xs text-destructive">{(validatePromo.error as Error).message}</p>
      )}
    </div>
  );
};

export default PromoCodeInput;
