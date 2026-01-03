import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MenuSection from '@/components/MenuSection';
import ReservationForm from '@/components/ReservationForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <MenuSection />
        <ReservationForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
