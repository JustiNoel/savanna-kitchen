import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, Smartphone, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/context/AuthContext';

interface CategoryPaymentDetails {
  provider: string;
  account_name: string | null;
  paybill_number: string | null;
  till_number: string | null;
  account_number: string | null;
  bank_name: string | null;
  partner_name: string | null;
}

interface CategoryPaymentInstructionsProps {
  categorySlug: string;
  totalAmount: number;
  isConfirmed: boolean;
  onPaymentConfirmed: (transactionCode: string) => void;
}

const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

export const CategoryPaymentInstructions = ({
  categorySlug,
  totalAmount,
  isConfirmed,
  onPaymentConfirmed,
}: CategoryPaymentInstructionsProps) => {
  const { isAdmin } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const maintenanceLocked = appSettings.maintenance_mode && !isAdmin;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CategoryPaymentDetails | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase.functions.invoke('category-payment', {
          body: { slug: categorySlug },
        });
        if (error) throw error;
        if (!active) return;
        setDetails((data?.payment as CategoryPaymentDetails | null) ?? null);
        setCategoryName((data?.category?.name as string) ?? '');
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error ? err.message : 'Could not load payment details'
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const handleConfirm = async () => {
    const cleaned = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,15}$/.test(cleaned)) {
      toast.error('Enter the M-Pesa confirmation code exactly as you received it');
      return;
    }
    setSubmitting(true);
    try {
      await onPaymentConfirmed(cleaned);
    } catch {
      toast.error('Could not submit your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (maintenanceLocked) {
    return (
      <Card className="rounded-xl border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
            <Wrench className="h-5 w-5" /> Payments Temporarily Disabled
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {appSettings.maintenance_message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isConfirmed) {
    return (
      <Card className="rounded-xl border-green-500/50 bg-green-50 dark:bg-green-950/30">
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle2 className="h-14 w-14 text-green-500" />
          </motion.div>
          <h3 className="font-display text-lg font-bold text-green-700 dark:text-green-300">
            Payment submitted
          </h3>
          <p className="text-sm text-center text-green-700 dark:text-green-400">
            We are confirming your M-Pesa payment and preparing your order.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="rounded-xl border-destructive/40">
        <CardContent className="pt-6 space-y-2 text-sm">
          <p className="font-medium text-destructive">
            We could not load the payment details.
          </p>
          <p className="text-muted-foreground">{loadError}</p>
          <p className="text-muted-foreground">
            Please try again in a moment or contact us on +254 752 140 592.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!details) {
    return (
      <Card className="rounded-xl border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6 space-y-2 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Payment for {categoryName || 'this category'} is not set up yet.
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            Please call or WhatsApp +254 752 140 592 to complete your order.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rows: Array<[string, string]> = [];
  if (details.partner_name) rows.push(['Paying', details.partner_name]);
  if (details.paybill_number) rows.push(['Paybill', details.paybill_number]);
  if (details.till_number) rows.push(['Till number', details.till_number]);
  if (details.account_number) rows.push(['Account number', details.account_number]);
  if (details.bank_name) rows.push(['Bank', details.bank_name]);
  if (details.account_name) rows.push(['Account name', details.account_name]);

  return (
    <Card className="rounded-xl border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-5 w-5 text-primary" />
          Pay for {categoryName || 'your order'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-primary text-primary-foreground p-4 text-center">
          <p className="text-sm opacity-90">Amount to pay</p>
          <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
        </div>

        <div className="rounded-lg border divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 p-3">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold break-all text-right">{value}</span>
            </div>
          ))}
        </div>

        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <li>Open M-Pesa and pay the exact amount above to these details.</li>
          <li>Copy the confirmation code from the M-Pesa SMS.</li>
          <li>Paste it below and confirm — we start preparing right away.</li>
        </ol>

        <div className="space-y-1.5">
          <Label htmlFor="mpesa-code">M-Pesa confirmation code</Label>
          <Input
            id="mpesa-code"
            className="rounded-lg uppercase"
            placeholder="e.g. SJH4K9LM2Q"
            value={code}
            maxLength={15}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-muted-foreground">
            Only the account shown above is valid for this order.
          </p>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 justify-center text-center">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Pay exactly {formatPrice(totalAmount)} — wrong amounts delay delivery.
          </p>
        </div>

        <Button
          className="w-full h-12 rounded-lg text-base"
          disabled={submitting || code.trim().length < 8}
          onClick={handleConfirm}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 mr-2" /> I have paid — place my order
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryPaymentInstructions;
