import { MapPin, Phone, Clock, Mail, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/savanna-kitchen-logo.png';

const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Grabbys" className="h-12 w-12 object-contain" />
              <h3 className="font-display text-xl font-bold">
                <span className="text-primary">Grabbys</span>
              </h3>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Your one-stop destination for delicious food, fresh groceries, everyday essentials, and premium spirits. Delivered to your doorstep! 🚀
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70 text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Kenyatta Avenue, Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-background/70 text-sm">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+254 700 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-background/70 text-sm">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:grabbysapp@gmail.com" className="hover:text-primary transition-colors">
                  grabbysapp@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Opening Hours</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70 text-sm">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-background">Mon - Fri</p>
                  <p>7:00 AM - 10:00 PM</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-background/70 text-sm">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-background">Sat - Sun</p>
                  <p>8:00 AM - 11:00 PM</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <a 
                href="https://www.facebook.com/share/1Cifm4QdC2/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/_grabbys?igsh=aG5nOXE5aGxpcm9z" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://x.com/Official_Grabby" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@official.grabbys?_r=1&_t=ZM-93Et5RxXtwR" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#menu" className="text-background/70 hover:text-primary transition-colors text-sm">
                  🍽️ Food
                </a>
              </li>
              <li>
                <a href="#groceries" className="text-background/70 hover:text-primary transition-colors text-sm">
                  🥕 Groceries
                </a>
              </li>
              <li>
                <a href="#shop" className="text-background/70 hover:text-primary transition-colors text-sm">
                  🏪 Shop
                </a>
              </li>
              <li>
                <a href="#spirits" className="text-background/70 hover:text-primary transition-colors text-sm">
                  🍾 Spirits
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2026 Grabbys. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-2xl">🇰🇪</span>
            <span className="text-background/50 text-sm">Made with ❤️ in Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
