import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, TrendingDown, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LowStockItem {
  id: string;
  name: string;
  stock_quantity: number | null;
  category: string;
  type: 'grocery' | 'shop' | 'spirits';
}

interface InventoryAlertsProps {
  groceryItems: LowStockItem[];
  shopItems: LowStockItem[];
  spiritsItems: LowStockItem[];
  onRestock?: (item: LowStockItem) => void;
}

const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

const InventoryAlerts = ({ groceryItems, shopItems, spiritsItems, onRestock }: InventoryAlertsProps) => {
  // Filter low stock items
  const allItems = [
    ...groceryItems.map(i => ({ ...i, type: 'grocery' as const })),
    ...shopItems.map(i => ({ ...i, type: 'shop' as const })),
    ...spiritsItems.map(i => ({ ...i, type: 'spirits' as const })),
  ];

  const lowStockItems = allItems.filter(
    item => item.stock_quantity !== null && item.stock_quantity <= LOW_STOCK_THRESHOLD
  );

  const criticalItems = lowStockItems.filter(
    item => item.stock_quantity !== null && item.stock_quantity <= CRITICAL_STOCK_THRESHOLD
  );

  const warningItems = lowStockItems.filter(
    item => item.stock_quantity !== null && item.stock_quantity > CRITICAL_STOCK_THRESHOLD
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grocery': return 'bg-green-500';
      case 'shop': return 'bg-purple-500';
      case 'spirits': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'grocery': return '🥕 Grocery';
      case 'shop': return '🏪 Shop';
      case 'spirits': return '🍾 Spirits';
      default: return type;
    }
  };

  if (lowStockItems.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-300">Inventory Healthy</h3>
              <p className="text-sm text-green-600 dark:text-green-400">All items are well-stocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      {criticalItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Stock Alert!</AlertTitle>
            <AlertDescription>
              {criticalItems.length} item(s) are critically low (≤5 units) and need immediate restocking.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Low Stock Items Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            Low Stock Alerts
            <Badge variant="secondary">{lowStockItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {/* Critical Items First */}
              {criticalItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(item.type)} variant="secondary">
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-red-600">{item.stock_quantity} left</p>
                      <p className="text-xs text-red-500">CRITICAL</p>
                    </div>
                    {onRestock && (
                      <Button size="sm" variant="destructive" onClick={() => onRestock(item)}>
                        Restock
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Warning Items */}
              {warningItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: (criticalItems.length + index) * 0.05 }}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(item.type)} variant="secondary">
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{item.stock_quantity} left</p>
                      <p className="text-xs text-yellow-500">LOW STOCK</p>
                    </div>
                    {onRestock && (
                      <Button size="sm" variant="outline" onClick={() => onRestock(item)}>
                        Restock
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;
