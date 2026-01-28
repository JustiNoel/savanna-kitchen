import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  }) => void;
  initialAddress?: string;
}

const LocationPicker = ({ onLocationSelect, initialAddress = '' }: LocationPickerProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [instructions, setInstructions] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    
    // Show permission request toast
    toast.info('Requesting location access...', { duration: 2000 });

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationError(null);

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
        setIsGettingLocation(false);
        let errorMessage = 'An error occurred while getting your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable it in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      options
    );
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    getCurrentLocation();
  };

  const handleConfirmLocation = () => {
    if (!address || latitude === null || longitude === null) {
      toast.error('Please get your location first');
      return;
    }

    onLocationSelect({
      address,
      latitude,
      longitude,
      instructions: instructions || undefined,
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
    setLocationError(null);
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
                    Getting your location...
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
              
              {locationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{locationError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-2"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {latitude && longitude && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
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
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Confirm Delivery Location
                  </Button>
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
                  <p className="text-sm text-green-700 dark:text-green-300 truncate">{address}</p>
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
