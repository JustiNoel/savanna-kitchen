import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrocerySection from '@/components/GrocerySection';
import CategoryWeeklySpecials from '@/components/CategoryWeeklySpecials';
import ReviewsSection from '@/components/ReviewsSection';
import FloatingCart from '@/components/FloatingCart';
import AIHelpChat from '@/components/AIHelpChat';
import RefreshAlert from '@/components/RefreshAlert';
import OrderTracker from '@/components/OrderTracker';
import DeliveryTracker from '@/components/DeliveryTracker';
import BackButton from '@/components/BackButton';
import MascotGuide from '@/components/MascotGuide';

const Grocery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RefreshAlert />
      <AIHelpChat />
      <FloatingCart />
      <MascotGuide />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
        <CategoryWeeklySpecials category="grocery" />
        <GrocerySection />
        <OrderTracker />
        <DeliveryTracker />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Grocery;

