import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Loader2, Sparkles, PackageOpen } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingCart from '@/components/FloatingCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const toPascal = (kebab: string) =>
  kebab.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');

const renderIcon = (name: string, color?: string, size = 28) => {
  const Icon = (LucideIcons as any)[toPascal(name)] || (LucideIcons as any).Package;
  return <Icon size={size} color={color} />;
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: categories } = useCategories({ onlyActive: true });
  const { branchId } = useUserBranch();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();

  const category = useMemo(
    () => categories?.find((c) => c.slug === slug),
    [categories, slug]
  );

  // Realtime sync of items
  useEffect(() => {
    const ch = supabase
      .channel('menu-items-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => queryClient.invalidateQueries({ queryKey: ['category-items'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['category-items', category?.id, branchId],
    queryFn: async () => {
      if (!category) return [];
      let q = supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_available', true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!category,
  });

  const featured = (items || []).filter((i: any) => i.is_featured);

  const handleAdd = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price),
      category: category?.slug || 'misc',
      ingredients: item.ingredients || [],
    });
    toast.success(`${item.name} added to cart`);
  };

  if (!categories) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-2">Category not found</h1>
          <p className="text-muted-foreground mb-6">
            This category doesn't exist or is no longer active.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero header */}
      <section
        className="relative pt-24 pb-12 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${category.color}25, ${category.color}05)`,
        }}
      >
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div
              className="h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${category.color}30`, color: category.color }}
            >
              {renderIcon(category.icon, category.color, 40)}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-muted-foreground mt-1 max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Featured row */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5" style={{ color: category.color }} />
              <h2 className="text-xl font-bold">Featured</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {featured.map((item: any) => (
                <Card
                  key={item.id}
                  className="min-w-[220px] snap-start border-2"
                  style={{ borderColor: `${category.color}40` }}
                >
                  <CardContent className="p-4 space-y-2">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: category.color }}>
                        KSh {Number(item.price).toLocaleString()}
                      </span>
                      <Button size="sm" onClick={() => handleAdd(item)}>
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All items grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (items?.length ?? 0) === 0 ? (
          <div className="text-center py-20">
            <PackageOpen
              className="h-20 w-20 mx-auto mb-4 opacity-30"
              style={{ color: category.color }}
            />
            <h3 className="text-xl font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground">
              No items in this category yet. Add items from the admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items!.map((item: any) => {
              const out = !item.is_available;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`overflow-hidden border-2 transition-all hover:shadow-xl ${
                      out ? 'opacity-60' : ''
                    }`}
                    style={{ borderTopColor: category.color, borderTopWidth: 3 }}
                  >
                    <div className="relative h-40 bg-muted">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {renderIcon(category.icon, category.color, 48)}
                        </div>
                      )}
                      {out && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <Badge variant="destructive">Unavailable</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold leading-tight line-clamp-1">
                        {item.name}
                      </h3>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold" style={{ color: category.color }}>
                          KSh {Number(item.price).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          disabled={out}
                          onClick={() => handleAdd(item)}
                        >
                          <ShoppingBag className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <FloatingCart />
      <Footer />
    </div>
  );
};

export default CategoryPage;
