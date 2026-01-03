import { MapPin, Phone, Clock, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌿</span>
              <h3 className="font-display text-xl font-bold">
                Savanna <span className="text-primary">Kitchen</span>
              </h3>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Serving authentic Kenyan cuisine since 2009. Experience the true taste of Africa with our traditional recipes.
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
                <span>justinoel254@gmail.com</span>
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

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#menu" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Our Menu
                </a>
              </li>
              <li>
                <a href="#about" className="text-background/70 hover:text-primary transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Reservations
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Catering Services
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2026 Savanna Kitchen. All rights reserved.
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
