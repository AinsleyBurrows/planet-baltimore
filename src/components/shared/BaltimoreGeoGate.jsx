import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Baltimore city center coordinates
const BALTIMORE_LAT = 39.2904;
const BALTIMORE_LNG = -76.6122;
const MAX_RADIUS_MILES = 15;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isInBaltimore(lat, lng) {
  const dist = haversineDistance(lat, lng, BALTIMORE_LAT, BALTIMORE_LNG);
  return dist <= MAX_RADIUS_MILES;
}

// Persists the check result so we only ask once per session
const GEO_CACHE_KEY = 'pb_geo_check';

export function useBaltimoreGeo() {
  const [status, setStatus] = useState('idle'); // idle | checking | allowed | denied | outside | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      setStatus(cached);
      return;
    }
    // Auto-check on mount
    check();
  }, []);

  const check = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const allowed = isInBaltimore(latitude, longitude);
        const result = allowed ? 'allowed' : 'outside';
        sessionStorage.setItem(GEO_CACHE_KEY, result);
        setStatus(result);
      },
      (err) => {
        // Permission denied or unavailable — allow by default to not block users
        sessionStorage.setItem(GEO_CACHE_KEY, 'allowed');
        setStatus('allowed');
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  };

  return { status, error, check };
}

// Block component — renders block UI when outside Baltimore
export default function BaltimoreGeoGate({ children, action = 'sign up as an artist' }) {
  const { status, error, check } = useBaltimoreGeo();

  if (status === 'idle' || status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Checking your location…</p>
      </div>
    );
  }

  if (status === 'outside') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Baltimore Artists Only</h2>
        <p className="text-sm text-muted-foreground">
          Planet Baltimore is a hyper-local platform for Baltimore City and the greater Baltimore metro area (within 15 miles). Your location appears to be outside this area.
        </p>
        <p className="text-xs text-muted-foreground">
          If you believe this is an error, please make sure location permissions are enabled for this site, or contact us for help.
        </p>
        <Button variant="outline" size="sm" onClick={check}>
          Try Again
        </Button>
      </div>
    );
  }

  return children;
}