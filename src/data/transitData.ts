/**
 * @file transitData.ts
 * Real-world Singapore transit presets and static reference data.
 *
 * Route OPTIONS (bus arrival times, train service status, computed
 * durations) are no longer hardcoded here — they come from
 * src/services/routePlanner.ts, which calls the live LTA-backed serverless
 * functions in /api and computes timings from real coordinates. This file
 * only holds: (1) named location presets with real, public coordinates and
 * their nearest MRT station, and (2) the pure walking-pace helper.
 */

import { TransitRoute } from '../types';
import { NearestMrt } from './mrtStations';

export type { NearestMrt };

/**
 * Anything route planning can work with: a real name, real coordinates, and
 * a nearest-MRT reference. Both a curated LocationPreset and a geocoded
 * custom search result (see services/geocode.ts) satisfy this shape, so
 * routePlanner.ts doesn't care which one it was given.
 */
export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nearestMrt: NearestMrt;
}

/** Quick location presets for origin and destination. */
export interface LocationPreset extends RoutePoint {
  type: 'home' | 'office' | 'mrt' | 'landmark';
  description: string;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'tampines',
    name: 'Tampines (Home)',
    type: 'home',
    description: 'Tampines Ave 4 / Stn',
    lat: 1.3496,
    lon: 103.9568,
    nearestMrt: { code: 'EW2/DT32', name: 'Tampines', lines: ['EW', 'DT'], lat: 1.3527, lon: 103.9448 },
  },
  {
    id: 'suntec',
    name: 'Suntec City (Office)',
    type: 'office',
    description: 'Suntec Tower 2 / Promenade',
    lat: 1.2955,
    lon: 103.8579,
    nearestMrt: { code: 'CC4/DT15', name: 'Promenade', lines: ['CC', 'DT'], lat: 1.2934, lon: 103.8607 },
  },
  {
    id: 'bugis',
    name: 'Bugis Junction',
    type: 'mrt',
    description: 'Bugis MRT Interchange (DTL/EWL)',
    lat: 1.3006,
    lon: 103.8559,
    nearestMrt: { code: 'EW12/DT14', name: 'Bugis', lines: ['EW', 'DT'], lat: 1.3006, lon: 103.8559 },
  },
  {
    id: 'jurong_east',
    name: 'Jurong East Stn',
    type: 'mrt',
    description: 'Jurong East Interchange (NSL/EWL)',
    lat: 1.3329,
    lon: 103.7436,
    nearestMrt: { code: 'NS1/EW24', name: 'Jurong East', lines: ['NS', 'EW'], lat: 1.3329, lon: 103.7436 },
  },
  {
    id: 'orchard',
    name: 'Orchard ION',
    type: 'landmark',
    description: 'Orchard MRT (NSL/TEL)',
    lat: 1.3040,
    lon: 103.8318,
    nearestMrt: { code: 'NS22/TE14', name: 'Orchard', lines: ['NS', 'TE'], lat: 1.3040, lon: 103.8318 },
  },
  {
    id: 'mbs',
    name: 'Marina Bay Sands',
    type: 'office',
    description: 'Bayfront MRT (DTL/CCL)',
    lat: 1.2834,
    lon: 103.8607,
    nearestMrt: { code: 'CE1/DT16', name: 'Bayfront', lines: ['CE', 'DT'], lat: 1.2823, lon: 103.8587 },
  },
  {
    id: 'bedok',
    name: 'Bedok Reservoir',
    type: 'mrt',
    description: 'Bedok Reservoir Stn Exit B',
    lat: 1.3363,
    lon: 103.9326,
    nearestMrt: { code: 'DT30', name: 'Bedok Reservoir', lines: ['DT'], lat: 1.3363, lon: 103.9326 },
  },
  {
    id: 'changi',
    name: 'Changi Airport T3',
    type: 'landmark',
    description: 'Airport Boulevard',
    lat: 1.3546,
    lon: 103.9880,
    nearestMrt: { code: 'CG2', name: 'Changi Airport', lines: ['CG'], lat: 1.3572, lon: 103.9885 },
  },
];

/**
 * Calculates walking pace recommendation based on distance.
 * Requirement:
 * > 100m: Vibrant yellow/orange warning badge: "Walk faster! (120 spm)"
 * <= 100m: Friendly green badge: "Just stroll, steady pom pi pi (60 spm)"
 */
export function getWalkingPaceAdvice(distanceMeters: number) {
  if (distanceMeters > 100) {
    return {
      isUrgent: true,
      text: 'Walk Faster! (120 spm)',
      shortText: 'Walk faster! (120 spm)',
      cadence: 120,
      description: 'Quick stride recommended to catch incoming transfer safely.',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20',
      icon: 'sprint',
    };
  } else {
    return {
      isUrgent: false,
      text: `Just Stroll (${distanceMeters}m)`,
      shortText: 'Just stroll, steady pom pi pi',
      cadence: 60,
      description: 'Relaxed walking pace, ample buffer to platform.',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20',
      icon: 'spa',
    };
  }
}

/**
 * Offline fallback shown only if the live route computation in
 * routePlanner.ts fails outright (e.g. no network reachable at all). Kept
 * tiny and clearly marked so it is never mistaken for live data — see
 * TransitRoute.isEstimate / liveDataNote on each route this produces.
 */
export const OFFLINE_FALLBACK_NOTICE =
  'Live LTA data unavailable right now — showing a rough distance-based estimate only.';
