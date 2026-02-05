import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MenuSection from '@/components/MenuSection';
import CategoryWeeklySpecials from '@/components/CategoryWeeklySpecials';
import ReviewsSection from '@/components/ReviewsSection';
import ReservationForm from '@/components/ReservationForm';
import DailyDishes from '@/components/DailyDishes';
import FloatingCart from '@/components/FloatingCart';
import AIHelpChat from '@/components/AIHelpChat';
import RefreshAlert from '@/components/RefreshAlert';
import OrderTracker from '@/components/OrderTracker';
import DeliveryTracker from '@/components/DeliveryTracker';

const Food = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RefreshAlert />
      <AIHelpChat />
      <FloatingCart />
      <main className="pt-20">
        <CategoryWeeklySpecials category="food" />
        <DailyDishes />
        <MenuSection />
        <OrderTracker />
        <DeliveryTracker />
        <ReservationForm />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Food;
