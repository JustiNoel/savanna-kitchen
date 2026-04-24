import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';

const MaintenanceBanner = () => {
  const { isAdmin } = useAuth();
  const { settings } = useAppSettings();
  const visible = settings.maintenance_mode && !isAdmin;

  // Push the fixed header & page content down so the banner is never covered.
  useEffect(() => {
    const root = document.documentElement;
    if (visible) {
      root.style.setProperty('--maintenance-offset', '44px');
      root.classList.add('maintenance-active');
    } else {
      root.style.setProperty('--maintenance-offset', '0px');
      root.classList.remove('maintenance-active');
    }
    return () => {
      root.style.setProperty('--maintenance-offset', '0px');
      root.classList.remove('maintenance-active');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-50 shadow-lg border-b border-amber-700/30"
    >
      <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
        <span className="flex-1 leading-snug">
          <strong>System Under Maintenance:</strong> {settings.maintenance_message} Ordering & payments are temporarily disabled.
        </span>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
