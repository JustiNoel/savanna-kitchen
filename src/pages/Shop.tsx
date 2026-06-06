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
import SEO from '@/components/SEO';
import bgShop from '@/assets/bg-shop.jpg';

const Shop = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Everyday Essentials & Household Shop | Grabbys Maseno"
        description="Order everyday household essentials and convenience items with fast doorstep delivery in Maseno, Kenya from the Grabbys Shop."
        path="/shop"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Service', name: 'Grabbys Shop Delivery', areaServed: 'Maseno, Kisumu, Kenya', description: 'Everyday household essentials and convenience items delivered to your door.', url: 'https://grabbys-kitchen.lovable.app/shop' }}
      />
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
        <h1 className="sr-only">Everyday Essentials & Household Shop</h1>
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

