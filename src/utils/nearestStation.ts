/**
 * @file nearestStation.ts
 * Finds the nearest MRT station (from the curated MRT_STATIONS reference
 * list) to any real lat/lon — this is what lets a custom geocoded address
 * (not just the 8 quick presets) plug into route planning.
 */

import { haversineMeters } from './geo';
import { MRT_STATIONS, NearestMrt } from '../data/mrtStations';

export function findNearestMrt(lat: number, lon: number): NearestMrt {
  let best = MRT_STATIONS[0];
  let bestDist = Infinity;
  for (const station of MRT_STATIONS) {
    const d = haversineMeters(lat, lon, station.lat, station.lon);
    if (d < bestDist) {
      bestDist = d;
      best = station;
    }
  }
  return best;
}
