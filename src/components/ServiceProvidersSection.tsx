import { motion } from 'framer-motion';
import { CalendarCheck, Mail, MapPin, MessageCircle, Phone, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceProviders } from '@/hooks/useServiceProviders';

interface ServiceProvidersSectionProps {
  categoryId: string;
  color: string;
}

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

export const ServiceProvidersSection = ({
  categoryId,
  color,
}: ServiceProvidersSectionProps) => {
  const { data: providers, isLoading, isError } = useServiceProviders(categoryId, true);

  if (isError) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-2">Book a service</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the service providers right now. Please refresh the page
          or try again in a moment.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </section>
    );
  }

  return (
    <section className="mt-12" aria-labelledby="book-a-service">
      <div className="flex items-center gap-2 mb-2">
        <CalendarCheck className="h-5 w-5" style={{ color }} />
        <h2 id="book-a-service" className="text-xl font-bold">
          Book a service
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Beauty and lifestyle services are done in person. Reach the provider directly to
        book your slot.
      </p>

      {(providers?.length ?? 0) === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-10 text-center space-y-3">
            <UserRound className="h-12 w-12 mx-auto opacity-30" style={{ color }} />
            <h3 className="font-semibold">No providers listed yet</h3>
            <p className="text-sm text-muted-foreground">
              Our stylists, barbers and beauty therapists are being onboarded. Check back
              soon or talk to us to get listed.
            </p>
            <Button asChild variant="outline" className="rounded-lg">
              <a href="https://wa.me/254752140592" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" /> Talk to Grabbys
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers!.map((p) => {
            const wa = digitsOnly(p.whatsapp || p.phone || '');
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="rounded-xl overflow-hidden shadow-sm h-full">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={`${p.name} offering ${p.service_title}`}
                      loading="lazy"
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold leading-tight">{p.service_title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" /> {p.name}
                    </p>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {p.description}
                      </p>
                    )}
                    {p.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
                      </p>
                    )}
                    {p.price_from !== null && (
                      <p className="font-bold" style={{ color }}>
                        From KSh {Number(p.price_from).toLocaleString()}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {p.phone && (
                        <Button asChild size="sm" variant="outline" className="rounded-lg">
                          <a href={`tel:${digitsOnly(p.phone)}`}>
                            <Phone className="h-3.5 w-3.5 mr-1" /> Call
                          </a>
                        </Button>
                      )}
                      {wa && (
                        <Button asChild size="sm" className="rounded-lg">
                          <a
                            href={`https://wa.me/${wa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                          </a>
                        </Button>
                      )}
                      {p.email && (
                        <Button asChild size="sm" variant="ghost" className="rounded-lg">
                          <a href={`mailto:${p.email}`}>
                            <Mail className="h-3.5 w-3.5 mr-1" /> Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ServiceProvidersSection;
