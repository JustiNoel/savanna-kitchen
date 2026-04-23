import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SpiritsSection from '@/components/SpiritsSection';
import CategoryWeeklySpecials from '@/components/CategoryWeeklySpecials';
import ReviewsSection from '@/components/ReviewsSection';
import FloatingCart from '@/components/FloatingCart';
import AIHelpChat from '@/components/AIHelpChat';
import RefreshAlert from '@/components/RefreshAlert';
import OrderTracker from '@/components/OrderTracker';
import DeliveryTracker from '@/components/DeliveryTracker';
import BackButton from '@/components/BackButton';
import MascotGuide from '@/components/MascotGuide';
import bgSpirits from '@/assets/bg-spirits.jpg';

const Spirits = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-10"
        style={{ backgroundImage: `url(${bgSpirits})` }}
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
        <div data-tour="weekly-specials"><CategoryWeeklySpecials category="spirits" /></div>
        <div data-tour="spirits-items"><SpiritsSection /></div>
        <OrderTracker />
        <DeliveryTracker />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Spirits;

