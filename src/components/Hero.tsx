import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import kitchenVideo from '@/assets/kitchen-background.mp4';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={kitchenVideo} type="video/mp4" />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-primary/20" />
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float z-10" />
      <div className="absolute bottom-32 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float z-10" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl animate-float z-10" style={{ animationDelay: '2s' }} />

      <div className="relative z-20 container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-8 border border-primary/20">
            <span className="text-sm font-medium text-primary">Authentic Kenyan Cuisine</span>
            <span className="text-lg">🇰🇪</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight drop-shadow-lg">
            Taste the
            <span className="block text-primary">Savanna</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed backdrop-blur-sm bg-background/20 rounded-lg p-4">
            Experience the rich flavors of Kenya with our traditional dishes. From smoky Nyama Choma to aromatic Pilau, every bite tells a story of African heritage.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="#menu">Explore Menu</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 backdrop-blur-sm bg-background/20">
              Book a Table
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto backdrop-blur-sm bg-background/30 rounded-2xl p-6">
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">20+</p>
              <p className="text-sm text-muted-foreground">Dishes</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">15</p>
              <p className="text-sm text-muted-foreground">Years</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">5K+</p>
              <p className="text-sm text-muted-foreground">Happy Guests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <a href="#menu" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors backdrop-blur-sm bg-background/30 rounded-full px-4 py-2">
          <span className="text-sm font-medium">Scroll to Menu</span>
          <ArrowDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
};

export default Hero;
