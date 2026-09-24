/**
 * @file geocode.ts
 * Turns free-text search into real RoutePoints, so the Plan tab isn't
 * limited to the 8 quick presets — this is what /api/geocode.js (OneMap
 * Singapore) backs.
 */

import { RoutePoint } from '../data/transitData';
import { findNearestMrt } from '../utils/nearestStation';

interface GeocodeApiResult {
  name: string;
  address: string;
  lat: number;
  lon: number;
}

interface GeocodeApiResponse {
  results: GeocodeApiResult[];
  isSimulated: boolean;
  message?: string;
}

export interface GeocodeSearchResult {
  points: RoutePoint[];
  isSimulated: boolean;
  message?: string;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Cancels any pending debounced search — call on unmount to avoid a late state update. */
export function cancelPendingSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
}

/** Debounced live-search: only the last call within `delayMs` actually fires. */
export function searchLocationsDebounced(
  query: string,
  onResult: (result: GeocodeSearchResult) => void,
  delayMs = 400
) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    onResult(await searchLocations(query));
  }, delayMs);
}

export async function searchLocations(query: string): Promise<GeocodeSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { points: [], isSimulated: false };
  }

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) throw new Error(`geocode responded ${res.status}`);
    const data: GeocodeApiResponse = await res.json();

    const points: RoutePoint[] = data.results.map((r, i) => ({
      id: `custom-${r.lat.toFixed(5)}-${r.lon.toFixed(5)}-${i}`,
      name: r.name || r.address,
      lat: r.lat,
      lon: r.lon,
      nearestMrt: findNearestMrt(r.lat, r.lon),
    }));

    return { points, isSimulated: data.isSimulated, message: data.message };
  } catch (err) {
    return {
      points: [],
      isSimulated: true,
      message: 'Could not reach location search right now.',
    };
  }
}
