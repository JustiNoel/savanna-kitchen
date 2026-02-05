import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle, RefreshCw, Edit3, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
    phoneNumber?: string;
  }) => void;
  initialAddress?: string;
}

const GPS_TIMEOUT_SECONDS = 20;

const LocationPicker = ({ onLocationSelect, initialAddress = '' }: LocationPickerProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [instructions, setInstructions] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [countdown, setCountdown] = useState(GPS_TIMEOUT_SECONDS);
  const [isManualMode, setIsManualMode] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(GPS_TIMEOUT_SECONDS);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setShowManualEntry(true);
      toast.error('Geolocation is not supported. Please enter your location manually.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    setShowManualEntry(false);
    startCountdown();
    
    toast.info('Requesting location access...', { duration: 2000 });

    // Set 20-second timeout for GPS
    timeoutRef.current = setTimeout(() => {
      if (isGettingLocation) {
        setIsGettingLocation(false);
        setLocationError('GPS taking too long. Please enter your location manually.');
        setShowManualEntry(true);
        if (countdownRef.current) clearInterval(countdownRef.current);
        toast.error('Location timeout. Please enter your address manually.');
      }
    }, GPS_TIMEOUT_SECONDS * 1000);

    const options = {
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT_SECONDS * 1000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Clear timeout since we got location
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationError(null);
        setShowManualEntry(false);
        setIsManualMode(false);

        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }

        setIsGettingLocation(false);
        toast.success('Location detected successfully!');
      },
      (error) => {
        // Clear timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        setIsGettingLocation(false);
        let errorMessage = 'An error occurred while getting your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enter your location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please enter your location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please enter your location manually.';
            break;
        }
        
        setLocationError(errorMessage);
        setShowManualEntry(true);
        toast.error(errorMessage);
      },
      options
    );
  }, [isGettingLocation, startCountdown]);

  const handleManualEntry = () => {
    setIsManualMode(true);
    setShowManualEntry(true);
    setIsGettingLocation(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    // Set default coordinates for Maseno area
    setLatitude(-0.0022);
    setLongitude(34.5992);
  };

  const handleConfirmLocation = () => {
    if (!address.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    
    if (isManualMode && !phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Use default Maseno coordinates if manual entry
    const finalLat = latitude ?? -0.0022;
    const finalLng = longitude ?? 34.5992;

    onLocationSelect({
      address: address.trim(),
      latitude: finalLat,
      longitude: finalLng,
      instructions: instructions.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    });
    setLocationConfirmed(true);
    toast.success('Delivery location confirmed!');
  };

  const handleReset = () => {
    setLocationConfirmed(false);
    setLatitude(null);
    setLongitude(null);
    setAddress('');
    setInstructions('');
    setPhoneNumber('');
    setLocationError(null);
    setShowManualEntry(false);
    setIsManualMode(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Delivery Location
          {locationConfirmed && (
            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!locationConfirmed ? (
          <>
            {!showManualEntry && !isManualMode && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={locationError ? "destructive" : "outline"}
                  className="w-full h-12 text-base"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Getting location... ({countdown}s)
                    </>
                  ) : locationError ? (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Try Again
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5 mr-2" />
                      📍 Use My Current Location
                    </>
                  )}
                </Button>
                
                {isGettingLocation && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground text-center"
                  >
                    Can't find location? Manual entry will appear in {countdown}s
                  </motion.p>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleManualEntry}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Enter Location Manually
                </Button>
              </div>
            )}

            {/* Manual Entry Form */}
            <AnimatePresence>
              {(showManualEntry || isManualMode) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {locationError && (
                    <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>GPS unavailable. Please enter your exact location below.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="manual-address" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Exact Delivery Address *
                    </Label>
                    <Textarea
                      id="manual-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="E.g., Maseno University Main Gate, opposite Total Petrol Station, Blue building 2nd floor"
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Be as specific as possible - include landmarks, building names, floor numbers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Active Phone Number *
                    </Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678"
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Rider will call this number for directions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="E.g., Gate code, ask for John at reception..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowManualEntry(false);
                        setIsManualMode(false);
                        setLocationError(null);
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Try GPS Again
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleConfirmLocation}
                      disabled={!address.trim() || !phoneNumber.trim()}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GPS Success Form */}
            <AnimatePresence>
              {latitude && longitude && !showManualEntry && !isManualMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Phone number alert */}
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-800">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">📞 Phone number required</p>
                      <p className="text-xs mt-1">Please add your phone number below so our rider can contact you for delivery.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Your delivery address"
                      className="text-sm"
                    />
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                    <span className="text-green-600">✓ GPS Active</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gps-phone-number" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Number *
                    </Label>
                    <Input
                      id="gps-phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678"
                      className="text-base border-amber-300 focus:border-amber-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required - Rider will call this number for directions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="E.g., Gate code, floor number, landmarks..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 text-base"
                    onClick={handleConfirmLocation}
                    disabled={!phoneNumber.trim()}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Confirm Delivery Location
                  </Button>
                  
                  {!phoneNumber.trim() && (
                    <p className="text-xs text-center text-amber-600">
                      ⚠️ Please enter your phone number to continue
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-800 dark:text-green-200">Location Confirmed</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{address}</p>
                  {phoneNumber && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {phoneNumber}
                    </p>
                  )}
                  {instructions && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      📝 {instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Change Location
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
