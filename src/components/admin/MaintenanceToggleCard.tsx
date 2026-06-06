import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppSettings, useUpdateAppSettings } from '@/hooks/useAppSettings';
import { toast } from 'sonner';

const MaintenanceToggleCard = () => {
  const { settings, loading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEnabled(settings.maintenance_mode);
    setMessage(settings.maintenance_message);
    setDirty(false);
  }, [settings.maintenance_mode, settings.maintenance_message]);

  const handleToggle = async (v: boolean) => {
    setEnabled(v);
    try {
      await update.mutateAsync({ maintenance_mode: v });
      toast.success(v ? 'Maintenance mode ON — orders are blocked for users.' : 'Maintenance mode OFF — ordering re-enabled.');
    } catch (e: any) {
      toast.error(e.message || 'Could not update');
      setEnabled(!v);
    }
  };

  const handleSaveMessage = async () => {
    try {
      await update.mutateAsync({ maintenance_message: message });
      toast.success('Maintenance message saved.');
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message || 'Could not save');
    }
  };

  return (
    <Card className={enabled ? 'border-amber-400' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-500" />
          <CardTitle>Maintenance Mode</CardTitle>
        </div>
        <CardDescription>
          When enabled, all non-admin users see a banner and cannot place orders or pay.
          Useful during system updates or when payment providers are down.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="font-medium">Block ordering</Label>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? '⚠️ Customers currently CANNOT place orders'
                    : '✅ Customers CAN place orders'}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={handleToggle} disabled={update.isPending} />
            </div>

            <div>
              <Label className="text-xs">Banner message shown to users</Label>
              <Textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setDirty(true); }}
                rows={3}
                maxLength={400}
                className="mt-1"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-muted-foreground">{message.length}/400</p>
                <Button
                  size="sm"
                  onClick={handleSaveMessage}
                  disabled={!dirty || update.isPending}
                >
                  <Save className="h-3 w-3 mr-1" /> Save message
                </Button>
              </div>
            </div>

            {enabled && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-amber-900 dark:text-amber-100">
                  Maintenance mode is ON. You (admin) bypass this lock and can still place test orders.
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceToggleCard;
