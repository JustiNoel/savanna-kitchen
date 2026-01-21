import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WelcomeGreeting from '@/components/WelcomeGreeting';
import WelcomePopup from '@/components/WelcomePopup';
import AIHelpChat from '@/components/AIHelpChat';
import DailyDishes from '@/components/DailyDishes';
import WeeklySpecials from '@/components/WeeklySpecials';
import MenuSection from '@/components/MenuSection';
import GrocerySection from '@/components/GrocerySection';
import ShopSection from '@/components/ShopSection';
import SpiritsSection from '@/components/SpiritsSection';
import OrderTracker from '@/components/OrderTracker';
import DeliveryTracker from '@/components/DeliveryTracker';
import GallerySection from '@/components/GallerySection';
import ReviewsSection from '@/components/ReviewsSection';
import LoyaltyPoints from '@/components/LoyaltyPoints';
import ReservationForm from '@/components/ReservationForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WelcomeGreeting />
      <WelcomePopup />
      <AIHelpChat />
      <main>
        <Hero />
        <DailyDishes />
        <WeeklySpecials />
        <OrderTracker />
        <DeliveryTracker />
        
        {/* Main Navigation Tabs for Food, Grocery, Shop, Spirits */}
        <section id="grabbys" className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Welcome to <span className="text-primary">Grabbys</span>
              </h2>
              <p className="text-muted-foreground">
                Your one-stop destination for food, groceries, essentials, and spirits 🚀
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a href="#menu" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
                🍽️ Grabby Food
              </a>
              <a href="#groceries" className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors">
                🥕 Grabby Grocery
              </a>
              <a href="#shop" className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors">
                🛒 Grabby Shop
              </a>
              <a href="#spirits" className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors">
                🍾 Grabby Spirits
              </a>
            </div>
          </div>
        </section>
        
        <MenuSection />
        <GrocerySection />
        <ShopSection />
        <SpiritsSection />
        <GallerySection />
        <section id="loyalty" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block text-primary font-medium mb-2">Rewards</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Loyalty <span className="text-primary">Program</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Earn points with every order and unlock exclusive discounts!
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <LoyaltyPoints />
            </div>
          </div>
        </section>
        <ReviewsSection />
        <ReservationForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
