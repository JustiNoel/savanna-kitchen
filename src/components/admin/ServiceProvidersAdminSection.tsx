import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import {
  ServiceProvider,
  useDeleteServiceProvider,
  useSaveServiceProvider,
  useServiceProviders,
} from '@/hooks/useServiceProviders';

interface FormState {
  id?: string;
  category_id: string;
  name: string;
  service_title: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  image_url: string;
  price_from: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  category_id: '',
  name: '',
  service_title: '',
  description: '',
  phone: '',
  whatsapp: '',
  email: '',
  location: '',
  image_url: '',
  price_from: '',
  display_order: 1,
  is_active: true,
};

export const ServiceProvidersAdminSection = () => {
  const { data: categories } = useCategories();
  const { data: providers, isLoading } = useServiceProviders();
  const saveMut = useSaveServiceProvider();
  const deleteMut = useDeleteServiceProvider();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ServiceProvider | null>(null);

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const openCreate = () => {
    setForm({ ...emptyForm, category_id: categories?.[0]?.id ?? '' });
    setOpen(true);
  };

  const openEdit = (p: ServiceProvider) => {
    setForm({
      id: p.id,
      category_id: p.category_id ?? '',
      name: p.name,
      service_title: p.service_title,
      description: p.description ?? '',
      phone: p.phone ?? '',
      whatsapp: p.whatsapp ?? '',
      email: p.email ?? '',
      location: p.location ?? '',
      image_url: p.image_url ?? '',
      price_from: p.price_from !== null ? String(p.price_from) : '',
      display_order: p.display_order,
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMut.mutateAsync({
      id: form.id,
      category_id: form.category_id || null,
      branch_id: null,
      name: form.name.trim(),
      service_title: form.service_title.trim(),
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      location: form.location.trim() || null,
      image_url: form.image_url.trim() || null,
      price_from: form.price_from ? Number(form.price_from) : null,
      display_order: form.display_order,
      is_active: form.is_active,
    });
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserRound className="h-6 w-6 text-primary" /> Service Providers
          </h2>
          <p className="text-sm text-muted-foreground">
            Stylists, barbers and therapists customers can contact directly to book.
          </p>
        </div>
        <Button className="rounded-lg" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add provider
        </Button>
      </div>

      {(providers?.length ?? 0) === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-10 text-center space-y-3">
            <UserRound className="h-12 w-12 mx-auto opacity-30" />
            <h3 className="font-semibold">No providers yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first beauty or lifestyle provider so customers can book them.
            </p>
            <Button className="rounded-lg" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers!.map((p) => (
            <Card key={p.id} className="rounded-xl shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{p.service_title}</h3>
                    <p className="text-sm text-muted-foreground">{p.name}</p>
                  </div>
                  <Badge variant={p.is_active ? 'default' : 'outline'}>
                    {p.is_active ? 'Live' : 'Hidden'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.category_id ? categoryName.get(p.category_id) ?? 'Category' : 'No category'}
                  {p.location ? ` · ${p.location}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[p.phone, p.email].filter(Boolean).join(' · ') || 'No contact set'}
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive rounded-lg"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit provider' : 'Add provider'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Provider name</Label>
                <Input
                  required
                  className="rounded-lg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Achieng Beauty Studio"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service offered</Label>
                <Input
                  required
                  className="rounded-lg"
                  value={form.service_title}
                  onChange={(e) => setForm({ ...form, service_title: e.target.value })}
                  placeholder="e.g. Braiding & hair treatment"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  className="rounded-lg"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+254 7xx xxx xxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input
                  className="rounded-lg"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+254 7xx xxx xxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  className="rounded-lg"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  className="rounded-lg"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Maseno Town, near Equity"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price from (KSh)</Label>
                <Input
                  inputMode="numeric"
                  className="rounded-lg"
                  value={form.price_from}
                  onChange={(e) => setForm({ ...form, price_from: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display order</Label>
                <Input
                  type="number"
                  className="rounded-lg"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Photo URL</Label>
              <Input
                className="rounded-lg"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What they offer, working hours, etc."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="provider-active" className="text-sm">
                Visible to customers
              </Label>
              <Switch
                id="provider-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this provider?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will no longer appear to customers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceProvidersAdminSection;
