/**
 * @file liveTracking.ts
 * Projects a remaining-time estimate from the user's live GPS position to
 * their destination, for use once a ride is active (Active Ride tab).
 *
 * Ethical-guardrail note: OnTime has no live transit-routing/traffic API
 * configured. This is NOT turn-by-turn rerouting — it projects a rough
 * remaining time from straight-line GPS distance using typical Singapore
 * urban travel paces, padded for a real (non-straight) path. Every
 * consumer must surface `method` so this is never mistaken for a precise
 * live ETA, matching how estimateDriveTime is already labeled.
 */

import { haversineMeters } from './geo';

export interface LiveRemainingEstimate {
  /** Padded path distance in meters (straight-line distance × path factor). */
  distanceMeters: number;
  estimatedMinutes: number;
  method: string;
}

/** Straight-line distance is padded to approximate an actual walking/road/rail path. */
const PATH_PADDING_FACTOR = 1.3;

/** ~5km/h brisk walking pace — matches WALK_SPEED_M_PER_MIN in routePlanner.ts. */
const WALK_KMH = 5;
/** Short bus/feeder hop, average incl. stops and waiting. */
const LOCAL_TRANSIT_KMH = 18;
/** MRT / expressway bus for the bulk of a longer trip. */
const LINE_HAUL_KMH = 32;

/**
 * Very close to the destination almost always means walking (the last leg
 * to/from a stop or station); mid-range is a local bus/feeder hop; farther
 * out assumes the trip is still mostly on MRT or an expressway bus. These
 * bands are a simplification, not a routing engine — same approach as
 * driveTime.ts's averageSpeedKmh.
 */
function effectivePaceKmh(straightLineKm: number): number {
  if (straightLineKm < 0.4) return WALK_KMH;
  if (straightLineKm < 3) return LOCAL_TRANSIT_KMH;
  return LINE_HAUL_KMH;
}

/**
 * Projects remaining minutes to the destination from a live lat/lon fix.
 * Always returns a value (never fails) — the caller decides whether to
 * trust this over the static route-plan estimate (e.g. when GPS is
 * unavailable).
 */
export function estimateRemainingMinutes(
  liveLat: number,
  liveLon: number,
  destLat: number,
  destLon: number
): LiveRemainingEstimate {
  const straightLineMeters = haversineMeters(liveLat, liveLon, destLat, destLon);
  const pathMeters = straightLineMeters * PATH_PADDING_FACTOR;
  const pathKm = pathMeters / 1000;
  const speedKmh = effectivePaceKmh(straightLineMeters / 1000);
  const minutes = Math.max(1, Math.round((pathKm / speedKmh) * 60));

  return {
    distanceMeters: Math.round(pathMeters),
    estimatedMinutes: minutes,
    method: `GPS-based estimate: straight-line distance × ${PATH_PADDING_FACTOR} path factor at ~${speedKmh}km/h avg pace (not live transit routing)`,
  };
}
