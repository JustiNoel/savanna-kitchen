import { Loader2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryPayments } from '@/hooks/useCategoryPayments';

const PROVIDER_LABEL: Record<string, string> = {
  mpesa: 'M-Pesa',
  bank: 'Bank transfer',
  paystack: 'Paystack',
  cash: 'Cash on delivery',
};

export const CategoryPayoutSummary = () => {
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: settings, isLoading } = useCategoryPayments();

  if (isLoading || loadingCategories) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const rows = (settings ?? []).map((s) => ({
    ...s,
    categoryName:
      categories?.find((c) => c.id === s.category_id)?.name ?? 'Unknown category',
    categoryColor: categories?.find((c) => c.id === s.category_id)?.color ?? '#94a3b8',
  }));

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Partner Payout Accounts
        </CardTitle>
        <CardDescription>
          Where each category&apos;s revenue is settled. Edit these under Category Payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No payout accounts set yet. Add them in the Category Payments tab.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: r.categoryColor }}
                      aria-hidden
                    />
                    <span className="font-semibold text-sm">{r.categoryName}</span>
                    <Badge variant={r.is_active ? 'default' : 'outline'}>
                      {r.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PROVIDER_LABEL[r.provider] ?? r.provider}
                    {r.partner_name ? ` · ${r.partner_name}` : ''}
                    {r.account_name ? ` · ${r.account_name}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      r.paybill_number ? `Paybill ${r.paybill_number}` : '',
                      r.till_number ? `Till ${r.till_number}` : '',
                      r.account_number ? `Acc ${r.account_number}` : '',
                      r.bank_name ?? '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No account details recorded'}
                  </p>
                </div>
                {r.payout_notes && (
                  <p className="text-xs text-muted-foreground max-w-xs">{r.payout_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryPayoutSummary;
