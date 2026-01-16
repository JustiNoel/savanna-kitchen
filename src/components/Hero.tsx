import { motion } from 'framer-motion';
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
      <motion.div 
        className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-10"
        animate={{ 
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl z-10"
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl z-10"
        animate={{ 
          x: [0, 10, 0],
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <div className="relative z-20 container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-8 border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-primary">Authentic Kenyan Cuisine</span>
            <span className="text-lg">🇰🇪</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Taste the
            <motion.span 
              className="block text-primary"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Savanna
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed backdrop-blur-sm bg-background/20 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Experience the rich flavors of Kenya with our traditional dishes. From smoky Nyama Choma to aromatic Pilau, every bite tells a story of African heritage.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="#menu">Explore Menu</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 backdrop-blur-sm bg-background/20">
              Book a Table
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto backdrop-blur-sm bg-background/30 rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">50+</p>
              <p className="text-sm text-muted-foreground">Dishes</p>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">15</p>
              <p className="text-sm text-muted-foreground">Years</p>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">5K+</p>
              <p className="text-sm text-muted-foreground">Happy Guests</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ 
          opacity: { delay: 1, duration: 0.5 },
          y: { delay: 1, duration: 1.5, repeat: Infinity }
        }}
      >
        <a href="#menu" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors backdrop-blur-sm bg-background/30 rounded-full px-4 py-2">
          <span className="text-sm font-medium">Scroll to Menu</span>
          <ArrowDown className="h-5 w-5" />
        </a>
      </motion.div>
    </section>
  );
};

export default Hero;
