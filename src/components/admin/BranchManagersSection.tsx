import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCog, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBranchManagers, useAssignBranchManager, useRemoveBranchManager } from '@/hooks/useBranchManagers';
import { useAllBranches } from '@/hooks/useBranches';

export default function BranchManagersSection() {
  const { data: managers = [], isLoading } = useBranchManagers();
  const { data: branches = [] } = useAllBranches();
  const assign = useAssignBranchManager();
  const remove = useRemoveBranchManager();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState('');

  const submit = async () => {
    if (!email.trim() || !branchId) {
      toast.error('Email and branch are required');
      return;
    }
    try {
      await assign.mutateAsync({ email: email.trim(), branchId });
      toast.success('Branch manager assigned');
      setOpen(false);
      setEmail('');
      setBranchId('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign');
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Branch Managers
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            One active manager per branch. The user must already have an account.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Assign Manager</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Branch Manager</DialogTitle>
              <DialogDescription>
                Search by email and choose the branch they should manage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>User Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@example.com" />
              </div>
              <div>
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.status === 'active').map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {b.university}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={assign.isPending}>
                {assign.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : managers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No branch managers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name || '—'}</TableCell>
                    <TableCell>{m.email || '—'}</TableCell>
                    <TableCell>{m.branch_name || '—'}</TableCell>
                    <TableCell>{new Date(m.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this manager?</AlertDialogTitle>
                            <AlertDialogDescription>
                              They will be reverted to a regular customer and lose access to the branch dashboard.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              try {
                                await remove.mutateAsync(m.id);
                                toast.success('Manager removed');
                              } catch (e: any) {
                                toast.error(e.message);
                              }
                            }}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
