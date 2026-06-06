import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WelcomeGreeting from '@/components/WelcomeGreeting';
import WelcomePopup from '@/components/WelcomePopup';
import AIHelpChat from '@/components/AIHelpChat';
import FloatingCart from '@/components/FloatingCart';
import MascotGuide from '@/components/MascotGuide';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import RefreshAlert from '@/components/RefreshAlert';
import BranchSelectModal from '@/components/BranchSelectModal';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Grabbys',
    url: 'https://grabbys-kitchen.lovable.app',
    logo: 'https://grabbys-kitchen.lovable.app/grabbys-logo.jpeg',
    sameAs: [
      'https://www.facebook.com/share/1Cifm4QdC2/',
      'https://www.instagram.com/_grabbys',
      'https://x.com/Official_Grabby',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Grabbys',
    url: 'https://grabbys-kitchen.lovable.app',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Grabbys | Food, Grocery, Shop & Spirits Delivery in Maseno"
        description="Order food, fresh groceries, everyday essentials and premium spirits in Maseno, Kenya. Fast doorstep delivery from Grabbys."
        path="/"
        jsonLd={homeJsonLd}
      />
      <Header />
      <WelcomeGreeting />
      <WelcomePopup />
      <BranchSelectModal />
      <AIHelpChat />
      <FloatingCart />
      <MascotGuide />
      <PushNotificationPrompt />
      <RefreshAlert />
      <main className="flex-1">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
