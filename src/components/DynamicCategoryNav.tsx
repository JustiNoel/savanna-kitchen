import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PROTECTED_HREF: Record<string, string> = {
  food: '/food',
  wines: '/spirits',
  spirits: '/spirits',
  shop: '/shop',
  grocery: '/grocery',
};

const toPascal = (kebab: string) =>
  kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

const renderIcon = (name: string, color?: string, size = 28) => {
  const Icon = (LucideIcons as any)[toPascal(name)] || (LucideIcons as any).Package;
  return <Icon size={size} color={color} />;
};

const DynamicCategoryNav = () => {
  const { data: categories, isLoading } = useCategories({ onlyActive: true });
  const { data: userBranch } = useUserBranch();

  // Get visibility filters
  const { data: visibility } = useQuery({
    queryKey: ['category-visibility-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('category_branch_visibility').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const visible = (categories || []).filter((c) => {
    if (c.visibility === 'all') return true;
    if (!userBranch) return false;
    return visibility?.some(
      (v: any) => v.category_id === c.id && v.branch_id === userBranch
    );
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!visible.length) return null;

  return (
    <motion.div
      data-tour="dynamic-categories"
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {visible.map((cat, index) => {
        const href = PROTECTED_HREF[cat.slug] || `/category/${cat.slug}`;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08 }}
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={href} className="block h-full">
              <Card
                className="h-full border-2 hover:shadow-2xl overflow-hidden backdrop-blur-sm transition-all duration-300"
                style={{
                  borderTopColor: cat.color,
                  borderTopWidth: 4,
                  background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)`,
                }}
              >
                <CardContent className="p-5 text-center space-y-3">
                  <div
                    className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    {renderIcon(cat.icon, cat.color, 32)}
                  </div>
                  <div>
                    <h3 className="font-display text-lg md:text-xl font-bold">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default DynamicCategoryNav;
