import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAllBranches, useUpsertBranch, useDeleteBranch, type Branch } from '@/hooks/useBranches';

export default function BranchesSection() {
  const { data: branches = [], isLoading } = useAllBranches();
  const upsert = useUpsertBranch();
  const del = useDeleteBranch();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [location, setLocation] = useState('');
  const [active, setActive] = useState(true);

  const reset = () => {
    setEditing(null);
    setName('');
    setUniversity('');
    setLocation('');
    setActive(true);
  };

  const startEdit = (b: Branch) => {
    setEditing(b);
    setName(b.name);
    setUniversity(b.university);
    setLocation(b.location || '');
    setActive(b.status === 'active');
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim() || !university.trim()) {
      toast.error('Branch name and university are required');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        name: name.trim(),
        university: university.trim(),
        location: location.trim() || null,
        status: active ? 'active' : 'inactive',
      });
      toast.success(editing ? 'Branch updated' : 'Branch created');
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save branch');
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            University Branches
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Each branch represents one university campus.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Branch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
              <DialogDescription>
                Create a new university campus for Grabby's.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Branch Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maseno Main Campus" />
              </div>
              <div>
                <Label>University</Label>
                <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. Maseno University" />
              </div>
              <div>
                <Label>Location / Description</Label>
                <Textarea value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Along Siriba Road, Kisumu" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive branches are hidden from signup.</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : branches.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No branches yet. Click "Add Branch" to create the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.university}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{b.location || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate this branch?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate the branch and unlink its manager. Customers already signed up under this branch will keep their accounts but won't see new menu updates. Are you sure?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => {
                                try {
                                  await del.mutateAsync(b.id);
                                  toast.success('Branch deactivated');
                                } catch (e: any) {
                                  toast.error(e.message);
                                }
                              }}>
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
