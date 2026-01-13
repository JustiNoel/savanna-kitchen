import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WelcomeGreeting from '@/components/WelcomeGreeting';
import WeeklySpecials from '@/components/WeeklySpecials';
import MenuSection from '@/components/MenuSection';
import OrderTracker from '@/components/OrderTracker';
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
      <main>
        <Hero />
        <WeeklySpecials />
        <OrderTracker />
        <MenuSection />
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
