import { ShoppingBag, Menu, X, User, LogIn, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CartSheet from './CartSheet';
import ThemeToggle from './ThemeToggle';
// Use Grabbys logo from public folder (matches favicon)

const navItems = [
  { href: '#menu', label: '🍽️ Food', color: 'bg-primary' },
  { href: '#groceries', label: '🥕 Grocery', color: 'bg-green-600' },
  { href: '#shop', label: '🛒 Shop', color: 'bg-purple-600' },
  { href: '#spirits', label: '🍾 Spirits', color: 'bg-amber-600' },
];

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/grabbys-logo.jpeg" alt="Grabbys" className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-lg" />
            <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
              <span className="text-primary">Grabbys</span>
            </h1>
          </Link>

          {/* Desktop Navigation - Animated Pills */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-full text-sm font-semibold text-white ${item.color} shadow-lg hover:shadow-xl transition-shadow`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="block"
                  animate={{ 
                    textShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 10px rgba(255,255,255,0.5)', '0 0 0px rgba(255,255,255,0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                  {item.label}
                </motion.span>
              </motion.a>
            ))}
            <a href="#contact" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm ml-2">
              Contact
            </a>
          </nav>

          {/* Cart & Auth */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <CartSheet />
              </SheetContent>
            </Sheet>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav 
            className="md:hidden py-4 border-t border-border"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-col gap-3">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={`${item.color} text-white px-4 py-3 rounded-xl font-semibold text-center shadow-md`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              <a
                href="#contact"
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-center py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              {user && (
                <>
                  <Link
                    to="/profile"
                    className="text-foreground/80 hover:text-primary transition-colors font-medium text-center py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-foreground/80 hover:text-primary transition-colors font-medium text-center py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  );
};

export default Header;
