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
import BackButton from '@/components/BackButton';
import MascotGuide from '@/components/MascotGuide';
import bgShop from '@/assets/bg-shop.jpg';

const Shop = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-10"
        style={{ backgroundImage: `url(${bgShop})` }}
        aria-hidden="true"
      />
      <Header />
      <RefreshAlert />
      <AIHelpChat />
      <FloatingCart />
      <MascotGuide />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
        <div data-tour="weekly-specials"><CategoryWeeklySpecials category="shop" /></div>
        <div data-tour="shop-items"><ShopSection /></div>
        <OrderTracker />
        <DeliveryTracker />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Shop;

