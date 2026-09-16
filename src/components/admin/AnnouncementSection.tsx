import { useState } from 'react';
import { Loader2, Megaphone, Send, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const DEFAULT_TITLE = 'Beauty & Lifestyle is here — welcome to a new semester!';

const DEFAULT_BODY = `Karibu back to a brand new semester and a brand new academic year!

We have introduced a new category: Beauty & Lifestyle. Cosmetics, skincare, hair, grooming and in-person beauty services are now just a few taps away on Grabbys — and you can reach a stylist or therapist directly to book your slot.

Grabbys also got a full upgrade: a fresh, softer bluish-white theme, a faster app and a smoother ordering experience from the first tap to your doorstep.

We have also opened new branches across campuses in the Nyanza region, so more students can order and get served from a branch close to them.

Open the app, explore Beauty & Lifestyle, and enjoy the new look.`;

export const AnnouncementSection = () => {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const send = async (test: boolean) => {
    if (title.trim().length < 3) {
      toast.error('Add a subject line first');
      return;
    }
    if (body.trim().length < 20) {
      toast.error('The message is too short');
      return;
    }
    if (test && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail.trim())) {
      toast.error('Enter a valid test email address');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-announcement', {
        body: {
          title: title.trim(),
          body: body.trim(),
          ...(test ? { testEmail: testEmail.trim() } : {}),
        },
      });
      if (error) throw error;
      const result = data as { sent?: number; failed?: number; total?: number };
      toast.success(
        test
          ? 'Test email sent'
          : `Announcement sent to ${result?.sent ?? 0} of ${result?.total ?? 0} customers`
      );
      if (!test && (result?.failed ?? 0) > 0) {
        toast.warning(`${result?.failed} emails could not be delivered`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sending failed';
      toast.error(`Could not send: ${message}`);
    } finally {
      setSending(false);
      setConfirmOpen(false);
      setConfirmText('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Customer Announcement
        </h2>
        <p className="text-sm text-muted-foreground">
          Email every registered Grabbys customer. Always send a test to yourself first.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Subject</Label>
            <Input
              id="ann-title"
              className="rounded-lg"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              rows={12}
              value={body}
              maxLength={8000}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/8000 characters. Leave a blank line between paragraphs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="ann-test">Send a test to</Label>
              <Input
                id="ann-test"
                className="rounded-lg"
                type="email"
                placeholder="justinoel254@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={sending}
              onClick={() => send(true)}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube2 className="h-4 w-4 mr-2" />
              )}
              Send test
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Button
              className="rounded-lg w-full sm:w-auto"
              disabled={sending}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" /> Send to all customers
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email every customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the message to all registered Grabbys customers and cannot be
              undone. Type SEND to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SEND"
            className="rounded-lg"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== 'SEND' || sending}
              onClick={(e) => {
                e.preventDefault();
                send(false);
              }}
            >
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementSection;
