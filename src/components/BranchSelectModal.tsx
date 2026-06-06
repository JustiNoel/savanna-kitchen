import { useEffect, useState } from 'react';
import { Loader2, MapPin, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useActiveBranches } from '@/hooks/useBranches';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * One-time prompt for logged-in customers who don't yet have a branch (university)
 * linked to their profile. Once chosen, all their future orders will route to that branch.
 */
const BranchSelectModal = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, branchId, loading: branchLoading } = useUserBranch();
  const { data: branches, isLoading: branchesLoading } = useActiveBranches();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Decide if we should show the modal
  useEffect(() => {
    if (authLoading || branchLoading) return;
    if (!user) return;
    if (!profile) return; // wait for profile fetch
    if (branchId) return; // already linked
    // Defer slightly so it doesn't fight other on-load popups
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [user, authLoading, branchLoading, profile, branchId]);

  const handleSave = async () => {
    if (!user || !selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ branch_id: selected })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Campus saved! Your orders will route here from now on.');
      queryClient.invalidateQueries({ queryKey: ['user-profile-branch'] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Could not save campus.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || branchId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-primary" />
            <DialogTitle>Pick your campus</DialogTitle>
          </div>
          <DialogDescription>
            Choose your university so we can route your orders to the right Grabbys branch.
            You can change this later from your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {branchesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (branches?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active branches yet. Please check back soon!
            </p>
          ) : (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your campus..." />
              </SelectTrigger>
              <SelectContent>
                {branches!.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {b.university}
                        {b.location ? ` — ${b.location}` : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Skip for now
            </Button>
            <Button onClick={handleSave} disabled={!selected || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save campus
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BranchSelectModal;
