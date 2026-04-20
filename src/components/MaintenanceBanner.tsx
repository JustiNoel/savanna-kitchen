import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MAINTENANCE_MODE, MAINTENANCE_MESSAGE } from '@/lib/maintenance';

const MaintenanceBanner = () => {
  const { isAdmin } = useAuth();
  if (!MAINTENANCE_MODE || isAdmin) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-50 shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">
          <strong>Maintenance Mode:</strong> {MAINTENANCE_MESSAGE}
        </span>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
