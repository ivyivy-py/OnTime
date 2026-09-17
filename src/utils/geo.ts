/**
 * @file geo.ts
 * Geospatial helpers: great-circle distance and browser geolocation.
 *
 * Ethical-guardrail note: haversineMeters computes an exact straight-line
 * ("as the crow flies") distance between two real coordinates. It is NOT a
 * road-network or walking-route distance. Callers that present a time
 * estimate derived from it must label it as an estimate.
 */

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Straight-line distance between two lat/lon points, in meters. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeolocationResult {
  point: GeoPoint | null;
  isLive: boolean;
  error?: string;
}

/**
 * Wraps navigator.geolocation in a promise. Never throws — resolves with
 * isLive:false and an error message when permission is denied, the browser
 * doesn't support it, or it times out, so callers can fall back to a
 * preset location without crashing.
 */
export function getBrowserLocation(timeoutMs = 6000): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ point: null, isLive: false, error: 'Geolocation not supported by this browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          point: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          isLive: true,
        });
      },
      (err) => {
        resolve({ point: null, isLive: false, error: err.message || 'Location permission denied.' });
      },
      { timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}

/** Formats a meter distance for display (e.g. "180m" or "2.4km"). */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
