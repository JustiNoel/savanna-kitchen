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

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
