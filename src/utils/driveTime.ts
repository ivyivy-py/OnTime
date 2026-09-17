/**
 * @file driveTime.ts
 * Estimated car/drive travel time.
 *
 * Ethical-guardrail note: OnTime has no live traffic/routing API integrated
 * (no Google/Grab/LTA driving-directions key configured). Rather than fake a
 * precise-looking number, this computes a transparent estimate from
 * straight-line distance and typical Singapore urban driving speeds, and
 * every consumer of this value MUST render the `isEstimate` / `method`
 * fields so the user knows it is not live traffic data.
 */

import { haversineMeters } from './geo';

export interface DriveEstimate {
  distanceMeters: number;
  estimatedMinutes: number;
  isEstimate: true;
  method: string;
}

/**
 * Very short trips are dominated by traffic lights and junctions (slow avg
 * speed); longer trips are more likely to use expressways (faster avg
 * speed). These bands are a simplification, not a routing engine.
 */
function averageSpeedKmh(straightLineKm: number): number {
  if (straightLineKm < 3) return 22;
  if (straightLineKm < 8) return 30;
  return 42;
}

/** Straight-line distance is padded to approximate actual road distance. */
const ROAD_NETWORK_FACTOR = 1.35;
/** Fixed allowance for pulling out of/into a pick-up/drop-off point. */
const PICKUP_BUFFER_MIN = 3;

export function estimateDriveTime(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): DriveEstimate {
  const straightLineMeters = haversineMeters(originLat, originLon, destLat, destLon);
  const roadMeters = straightLineMeters * ROAD_NETWORK_FACTOR;
  const roadKm = roadMeters / 1000;
  const speedKmh = averageSpeedKmh(straightLineMeters / 1000);
  const driveMinutes = (roadKm / speedKmh) * 60;
  const totalMinutes = Math.max(4, Math.round(driveMinutes + PICKUP_BUFFER_MIN));

  return {
    distanceMeters: Math.round(roadMeters),
    estimatedMinutes: totalMinutes,
    isEstimate: true,
    method: `Estimated from straight-line distance × ${ROAD_NETWORK_FACTOR} road-network factor at ~${speedKmh}km/h avg (no live traffic data)`,
  };
}
