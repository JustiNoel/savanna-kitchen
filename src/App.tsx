import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Rider from "./pages/Rider";
import BranchDashboard from "./pages/BranchDashboard";
import ResetPassword from "./pages/ResetPassword";
import Food from "./pages/Food";
import Grocery from "./pages/Grocery";
import Shop from "./pages/Shop";
import Spirits from "./pages/Spirits";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import NotificationListener from "./components/NotificationListener";
import MaintenanceBanner from "./components/MaintenanceBanner";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotificationListener />
            <BrowserRouter>
              <MaintenanceBanner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/food" element={<Food />} />
                <Route path="/grocery" element={<Grocery />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/spirits" element={<Spirits />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/rider" element={<Rider />} />
                <Route path="/branch-dashboard" element={<BranchDashboard />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
