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
import SEO from '@/components/SEO';
import bgGrocery from '@/assets/bg-grocery.jpg';

const Grocery = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Fresh Groceries Delivered in Maseno | Grabbys"
        description="Shop fresh vegetables, fruits and grocery staples online. Fast farm-to-door grocery delivery in Maseno, Kenya from Grabbys."
        path="/grocery"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Service', name: 'Grabbys Grocery Delivery', areaServed: 'Maseno, Kisumu, Kenya', description: 'Fresh fruits, vegetables and grocery staples delivered to your door.', url: 'https://grabbys-kitchen.lovable.app/grocery' }}
      />
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-10"
        style={{ backgroundImage: `url(${bgGrocery})` }}
        aria-hidden="true"
      />
      <Header />
      <RefreshAlert />
      <AIHelpChat />
      <FloatingCart />
      <MascotGuide />
      <main className="pt-20">
        <h1 className="sr-only">Fresh Groceries Delivered in Maseno</h1>
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
        <div data-tour="weekly-specials"><CategoryWeeklySpecials category="grocery" /></div>
        <div data-tour="grocery-items"><GrocerySection /></div>
        <OrderTracker />
        <DeliveryTracker />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Grocery;

