import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateReservation } from '@/hooks/useReservations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

const ReservationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createReservation = useCreateReservation();
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to make a reservation');
      navigate('/auth');
      return;
    }
    
    if (!date || !time || !name || !email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await createReservation.mutateAsync({
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        reservationDate: format(date, 'yyyy-MM-dd'),
        reservationTime: time,
        numberOfGuests: parseInt(guests),
        specialRequests,
      });
      
      toast.success('Reservation submitted successfully!');
      // Reset form
      setDate(undefined);
      setTime('');
      setGuests('2');
      setName('');
      setEmail('');
      setPhone('');
      setSpecialRequests('');
    } catch (error) {
      toast.error('Failed to create reservation. Please try again.');
    }
  };

  return (
    <section id="reservations" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-medium mb-2">Reservations</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Book Your <span className="text-primary">Table</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reserve your spot for an unforgettable dining experience with authentic Kenyan cuisine
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Make a Reservation
            </CardTitle>
            <CardDescription>
              Fill in the details below to reserve your table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Time Picker */}
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time">
                        {time && (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Number of Guests */}
              <div className="space-y-2">
                <Label>Number of Guests *</Label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {guests} {parseInt(guests) === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests (optional)</Label>
                <Textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any dietary requirements, celebrations, or special arrangements..."
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={createReservation.isPending}
              >
                {createReservation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Book Table'
                )}
              </Button>
              
              {!user && (
                <p className="text-center text-sm text-muted-foreground">
                  You'll need to{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                    sign in
                  </Button>{' '}
                  to complete your reservation
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ReservationForm;
