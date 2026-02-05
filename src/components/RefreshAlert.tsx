import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

const RefreshAlert = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    // Show alert after 5 minutes of being on the page
    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [lastCheck]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowAlert(false);
    setLastCheck(Date.now());
  };

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <Alert className="bg-primary/10 border-primary/30 backdrop-blur-sm shadow-lg">
            <RefreshCw className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-sm">
                Refresh the page for the latest updates!
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={handleRefresh}>
                  Refresh
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RefreshAlert;
