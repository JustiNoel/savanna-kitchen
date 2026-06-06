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
import SEO from '@/components/SEO';
import bgSpirits from '@/assets/bg-spirits.jpg';

const Spirits = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Premium Spirits, Wines & Beers Delivery | Grabbys Maseno"
        description="Order premium spirits, wines and beers online with fast doorstep delivery in Maseno, Kenya from Grabbys."
        path="/spirits"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Service', name: 'Grabbys Spirits Delivery', areaServed: 'Maseno, Kisumu, Kenya', description: 'Premium spirits, wines and beers delivered to your door.', url: 'https://grabbys-kitchen.lovable.app/spirits' }}
      />
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
        <h1 className="sr-only">Premium Spirits, Wines & Beers Delivery</h1>
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

