import { useState } from 'react';
import { Loader2, Save, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCategories, type Category } from '@/hooks/useCategories';
import {
  useCategoryPayments,
  useDeleteCategoryPayment,
  useSaveCategoryPayment,
  type CategoryPaymentSetting,
} from '@/hooks/useCategoryPayments';

const PROVIDERS = [
  { value: 'mpesa', label: 'M-Pesa Paybill / Till' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'paystack', label: 'Paystack (main account)' },
  { value: 'cash', label: 'Cash on delivery' },
];

interface RowProps {
  category: Category;
  setting?: CategoryPaymentSetting;
}

const PaymentRow = ({ category, setting }: RowProps) => {
  const saveMut = useSaveCategoryPayment();
  const deleteMut = useDeleteCategoryPayment();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    provider: setting?.provider ?? 'mpesa',
    partner_name: setting?.partner_name ?? '',
    account_name: setting?.account_name ?? '',
    paybill_number: setting?.paybill_number ?? '',
    till_number: setting?.till_number ?? '',
    account_number: setting?.account_number ?? '',
    bank_name: setting?.bank_name ?? '',
    payout_notes: setting?.payout_notes ?? '',
    is_active: setting?.is_active ?? true,
  });

  const handleSave = async () => {
    await saveMut.mutateAsync({ category_id: category.id, ...form });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-hidden
          />
          {category.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select
              value={form.provider}
              onValueChange={(v) => setForm({ ...form, provider: v })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Partner / business name</Label>
            <Input
              className="rounded-lg"
              value={form.partner_name}
              onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
              placeholder="e.g. Maseno Comfort Hotel"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account name</Label>
            <Input
              className="rounded-lg"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="Name on the payout account"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Paybill number</Label>
            <Input
              className="rounded-lg"
              inputMode="numeric"
              value={form.paybill_number}
              onChange={(e) => setForm({ ...form, paybill_number: e.target.value })}
              placeholder="e.g. 522522"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Till number</Label>
            <Input
              className="rounded-lg"
              inputMode="numeric"
              value={form.till_number}
              onChange={(e) => setForm({ ...form, till_number: e.target.value })}
              placeholder="e.g. 8054321"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account number</Label>
            <Input
              className="rounded-lg"
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              placeholder="Account / reference"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bank name</Label>
            <Input
              className="rounded-lg"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              placeholder="e.g. KCB Kisumu"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payout notes</Label>
            <Textarea
              rows={2}
              value={form.payout_notes}
              onChange={(e) => setForm({ ...form, payout_notes: e.target.value })}
              placeholder="e.g. 80/20 split, settled every Friday"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              id={`active-${category.id}`}
            />
            <Label htmlFor={`active-${category.id}`} className="text-sm">
              Active payout account
            </Label>
          </div>
          <div className="flex gap-2">
            {setting && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive rounded-lg"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-lg"
              onClick={handleSave}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment details?</AlertDialogTitle>
            <AlertDialogDescription>
              The payout account for {category.name} will be cleared. You can add it
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setting && deleteMut.mutate(setting.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export const CategoryPaymentsSection = () => {
  const { data: categories, isLoading } = useCategories();
  const { data: settings, isLoading: loadingSettings } = useCategoryPayments();

  if (isLoading || loadingSettings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Category Payment Accounts
        </h2>
        <p className="text-sm text-muted-foreground">
          Record the payout account for each category — for example a hotel partner that
          receives Food revenue. These details appear in the Finance section.
        </p>
      </div>

      {(categories?.length ?? 0) === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Create a category first, then set its payout account here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {categories!.map((c) => (
            <PaymentRow
              key={c.id}
              category={c}
              setting={settings?.find((s) => s.category_id === c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPaymentsSection;
