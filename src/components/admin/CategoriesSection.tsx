import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Plus, Pencil, Trash2, Lock, Search, Loader2 } from 'lucide-react';
import {
  Category,
  CategoryInput,
  slugify,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useToggleCategory,
  useUpdateCategory,
  useCategoryBranchVisibility,
} from '@/hooks/useCategories';
import { useBranches } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const ICON_OPTIONS = [
  'utensils', 'wine', 'shopping-bag', 'shopping-cart', 'shirt', 'sparkles',
  'zap', 'heart', 'star', 'gift', 'music', 'book', 'cpu', 'leaf', 'dumbbell',
  'scissors', 'watch', 'pizza', 'coffee', 'cake', 'flower', 'gem', 'glasses',
  'headphones', 'smartphone', 'laptop', 'camera', 'gamepad-2', 'palette',
  'paintbrush', 'pen-tool', 'baby', 'dog', 'home', 'car', 'plane', 'bike',
  'tent', 'package', 'tag', 'briefcase', 'graduation-cap', 'stethoscope',
];

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#7c3aed', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const toPascal = (kebab: string) =>
  kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

const renderIcon = (name: string, color?: string, size = 20) => {
  const Icon =
    (LucideIcons as any)[toPascal(name)] || (LucideIcons as any).Package;
  return <Icon size={size} color={color} />;
};

const emptyForm: CategoryInput = {
  name: '',
  slug: '',
  description: '',
  icon: 'package',
  color: '#f97316',
  display_order: 99,
  is_active: true,
  visibility: 'all',
  branch_ids: [],
};

const CategoriesSection = () => {
  const { data: categories, isLoading } = useCategories();
  const { data: branches } = useBranches();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const toggleMut = useToggleCategory();
  const deleteMut = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [iconSearch, setIconSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data: existingVisibility } = useCategoryBranchVisibility(editing?.id);

  const filteredIcons = useMemo(
    () =>
      ICON_OPTIONS.filter((i) =>
        i.toLowerCase().includes(iconSearch.toLowerCase())
      ),
    [iconSearch]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: (categories?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon,
      color: cat.color,
      display_order: cat.display_order,
      is_active: cat.is_active,
      visibility: cat.visibility,
      branch_ids: existingVisibility?.map((v: any) => v.branch_id) || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await updateMut.mutateAsync({ ...payload, id: editing.id });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget || confirmText !== deleteTarget.name) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setConfirmText('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Manage Categories</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage product categories that appear on the customer portal.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
          >
            <Card
              className="overflow-hidden border-2 transition-shadow hover:shadow-lg"
              style={{ borderTopColor: cat.color, borderTopWidth: 4 }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {renderIcon(cat.icon, cat.color, 28)}
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.is_protected && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" /> Protected
                      </Badge>
                    )}
                    <Badge variant={cat.is_active ? 'default' : 'outline'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {cat.description || 'No description'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cat.is_active}
                      onCheckedChange={(v) =>
                        toggleMut.mutate({ id: cat.id, is_active: v })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Visible</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!cat.is_protected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteTarget(cat);
                          setConfirmText('');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              Define the look, feel and visibility of this category.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm({
                      ...form,
                      name,
                      slug: editing ? form.slug : slugify(name),
                    });
                  }}
                  placeholder="e.g. Lifestyle"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="lifestyle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short subtitle shown to customers"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="grid grid-cols-8 gap-1">
                  {filteredIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm({ ...form, icon: ic })}
                      className={`p-2 rounded-md hover:bg-accent flex items-center justify-center transition-colors ${
                        form.icon === ic
                          ? 'bg-primary/10 ring-2 ring-primary'
                          : ''
                      }`}
                      title={ic}
                    >
                      {renderIcon(ic, undefined, 18)}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      form.color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-8 w-14 p-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: parseInt(e.target.value) || 99 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v: 'all' | 'specific') =>
                    setForm({ ...form, visibility: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="specific">Specific Branches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.visibility === 'specific' && (
              <div className="space-y-2">
                <Label>Select Branches</Label>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-2">
                    {branches?.map((b) => (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={form.branch_ids?.includes(b.id) ?? false}
                          onCheckedChange={(c) => {
                            const ids = new Set(form.branch_ids || []);
                            if (c) ids.add(b.id);
                            else ids.delete(b.id);
                            setForm({ ...form, branch_ids: Array.from(ids) });
                          }}
                        />
                        <span className="text-sm">
                          {b.name} <span className="text-muted-foreground">— {b.university}</span>
                        </span>
                      </label>
                    ))}
                    {!branches?.length && (
                      <p className="text-sm text-muted-foreground">No branches yet.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">Show this category to customers</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editing ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting <strong>{deleteTarget?.name}</strong> will also remove all items
              under it. This cannot be undone. Type the category name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={deleteTarget?.name}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== deleteTarget?.name}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesSection;
