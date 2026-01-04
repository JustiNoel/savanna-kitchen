import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Gallery images
import diningArea from '@/assets/gallery/dining-area-1.jpg';
import kitchen from '@/assets/gallery/kitchen-1.jpg';
import terrace from '@/assets/gallery/terrace.jpg';
import barArea from '@/assets/gallery/bar-area.jpg';
import privateDining from '@/assets/gallery/private-dining.jpg';
import chefCooking from '@/assets/gallery/chef-cooking.jpg';
import entrance from '@/assets/gallery/entrance.jpg';
import guestsDining from '@/assets/gallery/guests-dining.jpg';

const galleryImages = [
  {
    src: diningArea,
    title: 'Main Dining Area',
    description: 'Warm African ambiance with traditional décor',
  },
  {
    src: kitchen,
    title: 'Open Kitchen',
    description: 'Watch our chefs prepare your meal over open flames',
  },
  {
    src: terrace,
    title: 'Sunset Terrace',
    description: 'Outdoor dining with savanna views',
  },
  {
    src: barArea,
    title: 'Safari Bar',
    description: 'Traditional African art and handcrafted cocktails',
  },
  {
    src: privateDining,
    title: 'Private Dining',
    description: 'Intimate space for special occasions',
  },
  {
    src: chefCooking,
    title: 'Master Chef',
    description: 'Authentic African cuisine crafted with passion',
  },
  {
    src: entrance,
    title: 'Welcome',
    description: 'Experience the warmth of African hospitality',
  },
  {
    src: guestsDining,
    title: 'Celebrations',
    description: 'Creating memories with family and friends',
  },
];

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openImage = (index: number) => {
    setSelectedImage(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1
      );
    }
  };

  return (
    <section id="gallery" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-medium mb-2">Our Space</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Experience <span className="text-primary">Savanna Kitchen</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Step into our world of authentic African hospitality. From our warm dining areas to our bustling open kitchen, every corner tells a story.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`relative group cursor-pointer overflow-hidden rounded-xl ${
                index === 0 || index === 3 ? 'sm:col-span-2 sm:row-span-2' : ''
              }`}
              onClick={() => openImage(index)}
            >
              <div className={`${index === 0 || index === 3 ? 'aspect-square' : 'aspect-video'}`}>
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-display text-lg font-semibold">{image.title}</h3>
                  <p className="text-sm text-white/80">{image.description}</p>
                </div>
              </div>
              
              {/* Decorative border on hover */}
              <div className="absolute inset-0 border-4 border-primary/0 group-hover:border-primary/50 transition-colors duration-300 rounded-xl" />
            </div>
          ))}
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={selectedImage !== null} onOpenChange={closeImage}>
          <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
            {selectedImage !== null && (
              <div className="relative">
                <img
                  src={galleryImages[selectedImage].src}
                  alt={galleryImages[selectedImage].title}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={closeImage}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Navigation buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
                  <h3 className="font-display text-2xl font-semibold mb-1">
                    {galleryImages[selectedImage].title}
                  </h3>
                  <p className="text-white/80">
                    {galleryImages[selectedImage].description}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default GallerySection;
