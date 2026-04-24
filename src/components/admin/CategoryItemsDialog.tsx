import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Star, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Props {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  tags: string;
  is_featured: boolean;
  is_available: boolean;
}

const empty: ItemForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  tags: '',
  is_featured: false,
  is_available: true,
};

const CategoryItemsDialog = ({ category, open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<ItemForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(empty);
      setEditingId(null);
      setShowForm(false);
    }
  }, [open, category?.id]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-category-items', category?.id],
    queryFn: async () => {
      if (!category) return [];
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!category && open,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error('No category');
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price) || 0,
        image_url: form.image_url.trim() || null,
        tags,
        is_featured: form.is_featured,
        is_available: form.is_available,
        category: category.slug,
        category_id: category.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-category-items', category?.id] });
      qc.invalidateQueries({ queryKey: ['category-items'] });
      toast.success(editingId ? 'Item updated' : 'Item added');
      setForm(empty);
      setEditingId(null);
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save item'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-category-items', category?.id] });
      qc.invalidateQueries({ queryKey: ['category-items'] });
      toast.success('Item deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: String(item.price || ''),
      image_url: item.image_url || '',
      tags: (item.tags || []).join(', '),
      is_featured: !!item.is_featured,
      is_available: item.is_available !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    saveMut.mutate();
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: category.color }}
            >
              {category.name.charAt(0)}
            </span>
            Items in {category.name}
          </DialogTitle>
          <DialogDescription>
            Add, edit and remove products inside this category. Changes appear instantly on the customer portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && (
            <Button
              onClick={() => {
                setForm(empty);
                setEditingId(null);
                setShowForm(true);
              }}
              className="w-full"
              style={{ backgroundColor: category.color }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item to {category.name}
            </Button>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 rounded-lg border-2 p-4"
              style={{ borderColor: `${category.color}40` }}
            >
              <h3 className="font-semibold text-sm">
                {editingId ? 'Edit Item' : 'New Item'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Item Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Cotton T-Shirt"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short product description"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price (KSh) *</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="new, trending"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="mt-2 h-24 w-24 object-cover rounded-md border"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" /> Featured
                  </Label>
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <Label className="text-xs">In Stock</Label>
                  <Switch
                    checked={form.is_available}
                    onCheckedChange={(v) => setForm({ ...form, is_available: v })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(empty);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saveMut.isPending}>
                  {saveMut.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Item'}
                </Button>
              </div>
            </form>
          )}

          <ScrollArea className="h-[40vh] rounded-md border p-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !items?.length ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No items yet. Click "Add New Item" above to create your first product.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((it: any) => (
                  <motion.div
                    key={it.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-3 flex gap-3">
                        <div className="h-16 w-16 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                          {it.image_url ? (
                            <img
                              src={it.image_url}
                              alt={it.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm truncate">{it.name}</h4>
                              <p className="text-xs font-bold" style={{ color: category.color }}>
                                KSh {Number(it.price).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleEdit(it)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  if (confirm(`Delete "${it.name}"?`)) deleteMut.mutate(it.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {it.is_featured && (
                              <Badge variant="secondary" className="text-[10px]">
                                <Star className="h-2 w-2 mr-1" /> Featured
                              </Badge>
                            )}
                            {!it.is_available && (
                              <Badge variant="destructive" className="text-[10px]">
                                Out of stock
                              </Badge>
                            )}
                            {(it.tags || []).slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="outline" className="text-[10px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryItemsDialog;
