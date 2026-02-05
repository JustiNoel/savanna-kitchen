import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShopSection from '@/components/ShopSection';
import CategoryWeeklySpecials from '@/components/CategoryWeeklySpecials';
import ReviewsSection from '@/components/ReviewsSection';
import FloatingCart from '@/components/FloatingCart';
import AIHelpChat from '@/components/AIHelpChat';
import RefreshAlert from '@/components/RefreshAlert';
import OrderTracker from '@/components/OrderTracker';
import DeliveryTracker from '@/components/DeliveryTracker';

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RefreshAlert />
      <AIHelpChat />
      <FloatingCart />
      <main className="pt-20">
        <CategoryWeeklySpecials category="shop" />
        <ShopSection />
        <OrderTracker />
        <DeliveryTracker />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
