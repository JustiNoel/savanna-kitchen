import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has seen the welcome popup before
    const hasSeenWelcome = localStorage.getItem('savanna_welcome_shown');
    
    if (!hasSeenWelcome) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('savanna_welcome_shown', 'true');
  };

  const handleExplore = () => {
    handleClose();
    // Scroll to menu section
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-card rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-8 text-primary-foreground">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center">
                    <UtensilsCrossed className="h-10 w-10" />
                  </div>
                </motion.div>
                
                <motion.h2
                  className="text-3xl font-display font-bold text-center mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Welcome to Savanna Kitchen!
                </motion.h2>
                
                <motion.p
                  className="text-center opacity-90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Experience authentic African cuisine
                </motion.p>
              </div>

              {/* Content */}
              <div className="p-8">
                <motion.div
                  className="space-y-4 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">50+ Authentic Dishes</h3>
                      <p className="text-sm text-muted-foreground">
                        From Kenya, Nigeria, Ethiopia & more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Earn Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        Get points on every order & redeem for discounts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Weekly Specials</h3>
                      <p className="text-sm text-muted-foreground">
                        Exclusive deals on featured dishes
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={handleExplore}
                    className="flex-1 h-12 text-lg"
                  >
                    Explore Menu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-12"
                  >
                    Maybe Later
                  </Button>
                </motion.div>

                {!user && (
                  <motion.p
                    className="text-center text-sm text-muted-foreground mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <a href="/auth" className="text-primary hover:underline">
                      Sign up
                    </a>{' '}
                    to start earning rewards today!
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
