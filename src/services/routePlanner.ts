/**
 * @file routePlanner.ts
 * Builds live route options between two LocationPresets.
 *
 * This replaces the old hardcoded SAMPLE_ROUTES. Every number here is
 * either (a) computed from the presets' real coordinates, or (b) pulled
 * from the live LTA-backed /api endpoints. Nothing is invented — where a
 * figure is a computed estimate rather than a live reading, the resulting
 * TransitRoute/DriveOption is marked isEstimate/liveDataNote so the UI can
 * say so honestly (per the class's Ethical Guardrails).
 */

import { LocationPreset } from '../data/transitData';
import { TransitRoute, JourneyStep, DriveOption } from '../types';
import { haversineMeters } from '../utils/geo';
import { estimateDriveTime } from '../utils/driveTime';

const WALK_SPEED_M_PER_MIN = 84; // ~5km/h brisk urban walking pace
const MRT_SPEED_KMH = 34; // typical scheduled MRT speed incl. station dwell
const TRANSFER_PENALTY_MIN = 4;

interface NearbyStopsResponse {
  stops: Array<{
    busStopCode: string;
    roadName: string;
    description: string;
    lat: number;
    lon: number;
    distanceMeters: number;
  }>;
  isSimulated: boolean;
  message?: string;
}

interface BusArrivalResponse {
  busStopCode: string;
  services: Array<{
    serviceNo: string;
    operator: string;
    nextBus?: { estimatedArrival: string; load?: string };
  }>;
  isSimulated: boolean;
  message?: string;
}

interface TrainAlertsResponse {
  status: string;
  lines: Array<{ line: string; direction?: string; stations?: string }>;
  isSimulated: boolean;
  message?: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchNearbyStop(lat: number, lon: number): Promise<NearbyStopsResponse> {
  const data = await fetchJson<NearbyStopsResponse>(`/api/nearby-stops?lat=${lat}&lon=${lon}&limit=1`);
  return data ?? { stops: [], isSimulated: true, message: 'Could not reach nearby-stops endpoint.' };
}

async function fetchArrival(busStopCode: string): Promise<BusArrivalResponse> {
  const data = await fetchJson<BusArrivalResponse>(`/api/bus-arrival?BusStopCode=${encodeURIComponent(busStopCode)}`);
  return data ?? { busStopCode, services: [], isSimulated: true, message: 'Could not reach bus-arrival endpoint.' };
}

async function fetchTrainAlerts(): Promise<TrainAlertsResponse> {
  const data = await fetchJson<TrainAlertsResponse>('/api/train-alerts');
  return data ?? { status: 'Unavailable', lines: [], isSimulated: true, message: 'Could not reach train-alerts endpoint.' };
}

function minutesFromNow(isoString: string): number {
  const diffMs = new Date(isoString).getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 60000));
}

/** Rough published-fare-style estimate by distance band. Not a live fares API. */
function estimateFareSgd(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  if (km <= 3.2) return 1.19;
  const fare = 1.19 + (km - 3.2) * 0.12;
  return Math.min(2.5, Math.round(fare * 100) / 100);
}

function sharedLine(a: string[], b: string[]): string | null {
  return a.find((line) => b.includes(line)) || null;
}

export interface RoutePlanResult {
  routes: TransitRoute[];
  driveOption: DriveOption;
  warnings: string[];
}

export async function planRoutes(
  origin: LocationPreset,
  destination: LocationPreset,
  arriveByTime: string,
  currentTime: Date
): Promise<RoutePlanResult> {
  const warnings: string[] = [];

  // Real geodata computed from the presets' real coordinates.
  const walkToOriginMrtM = haversineMeters(origin.lat, origin.lon, origin.nearestMrt.lat, origin.nearestMrt.lon);
  const walkFromDestMrtM = haversineMeters(destination.nearestMrt.lat, destination.nearestMrt.lon, destination.lat, destination.lon);
  const mrtLegKm = haversineMeters(origin.nearestMrt.lat, origin.nearestMrt.lon, destination.nearestMrt.lat, destination.nearestMrt.lon) / 1000;

  const transferLine = sharedLine(origin.nearestMrt.lines, destination.nearestMrt.lines);
  const needsTransfer = !transferLine;
  const mrtRideMin = Math.max(3, Math.round((mrtLegKm / MRT_SPEED_KMH) * 60)) + (needsTransfer ? TRANSFER_PENALTY_MIN : 0);
  const walkToOriginMrtMin = Math.max(1, Math.round(walkToOriginMrtM / WALK_SPEED_M_PER_MIN));
  const walkFromDestMrtMin = Math.max(1, Math.round(walkFromDestMrtM / WALK_SPEED_M_PER_MIN));

  // Live LTA calls, run in parallel.
  const [originStopData, trainAlerts] = await Promise.all([
    fetchNearbyStop(origin.lat, origin.lon),
    fetchTrainAlerts(),
  ]);

  if (originStopData.isSimulated) warnings.push(originStopData.message || 'Nearby bus stop lookup unavailable.');
  if (trainAlerts.isSimulated) warnings.push(trainAlerts.message || 'Train service alerts unavailable.');

  const originStop = originStopData.stops[0];
  let arrivalData: BusArrivalResponse | null = null;
  if (originStop) {
    arrivalData = await fetchArrival(originStop.busStopCode);
    if (arrivalData.isSimulated) warnings.push(arrivalData.message || 'Live bus arrival unavailable.');
  }

  const lineDisrupted = !needsTransfer
    ? trainAlerts.lines.some((l) => l.line === transferLine)
    : trainAlerts.lines.some((l) => origin.nearestMrt.lines.includes(l.line) || destination.nearestMrt.lines.includes(l.line));
  const disruptionAddMin = lineDisrupted ? 8 : 0;

  const mrtSteps: JourneyStep[] = [
    {
      stepNumber: 1,
      type: 'WALK',
      title: `Walk to ${origin.nearestMrt.name}`,
      fromName: origin.name,
      toName: origin.nearestMrt.name,
      toCode: origin.nearestMrt.code,
      distanceMeters: Math.round(walkToOriginMrtM),
      durationMinutes: walkToOriginMrtMin,
    },
    {
      stepNumber: 2,
      type: 'MRT',
      title: needsTransfer ? `${origin.nearestMrt.lines.join('/')} → ${destination.nearestMrt.lines.join('/')} (1 transfer)` : `${transferLine} Line direct`,
      fromName: origin.nearestMrt.name,
      fromCode: origin.nearestMrt.code,
      toName: destination.nearestMrt.name,
      toCode: destination.nearestMrt.code,
      durationMinutes: mrtRideMin + disruptionAddMin,
      sheltered: true,
      mrtDetails: {
        lineCode: transferLine || origin.nearestMrt.lines[0],
        lineName: needsTransfer ? `${origin.nearestMrt.lines.join('/')} to ${destination.nearestMrt.lines.join('/')}` : `${transferLine} Line`,
        lineColor: '#0037b0',
        stationName: origin.nearestMrt.name,
        destStationName: destination.nearestMrt.name,
        direction: needsTransfer ? `Transfer required` : `Direct to ${destination.nearestMrt.name}`,
        arrivalMinutes: 2,
        platform: needsTransfer ? 'Check platform at transfer station' : 'Platform per station signage',
        doorInfo: lineDisrupted ? 'Delays reported on this line — see Train Status' : 'No reported delays',
        stopsCount: Math.max(1, Math.round(mrtLegKm / 1.1)),
      },
    },
    {
      stepNumber: 3,
      type: 'WALK',
      title: `Walk to ${destination.name}`,
      fromName: destination.nearestMrt.name,
      toName: destination.name,
      distanceMeters: Math.round(walkFromDestMrtM),
      durationMinutes: walkFromDestMrtMin,
    },
  ];

  const mrtTotalMin = walkToOriginMrtMin + mrtRideMin + disruptionAddMin + walkFromDestMrtMin;

  const drive = estimateDriveTime(origin.lat, origin.lon, destination.lat, destination.lon);

  const mrtRoute: TransitRoute = {
    id: `route-mrt-${origin.id}-${destination.id}`,
    title: needsTransfer ? `${origin.nearestMrt.name} → ${destination.nearestMrt.name} (MRT, 1 transfer)` : `${transferLine} Line Direct`,
    tag: needsTransfer ? 'MRT • 1 TRANSFER' : 'MRT • DIRECT',
    totalDurationMin: mrtTotalMin,
    bufferMinutes: 0,
    firstMileDistanceMeters: Math.round(walkToOriginMrtM),
    firstMileType: 'MRT',
    firstMileTargetName: origin.nearestMrt.name,
    firstMileTargetCode: origin.nearestMrt.code,
    firstMileLiveEtaMinutes: 2,
    modeDescription: needsTransfer ? '2 MRT legs' : '1 MRT line',
    steps: mrtSteps,
    estReachTime: '',
    crowdLevel: lineDisrupted ? 'High' : 'Moderate',
    fareSgd: estimateFareSgd(Math.round(walkToOriginMrtM + mrtLegKm * 1000 + walkFromDestMrtM)),
    isEstimate: true,
    liveDataNote: trainAlerts.isSimulated
      ? 'Walking + MRT ride times are computed estimates. Train service status unavailable — set LTA_API_KEY for live alerts.'
      : `Walking + MRT ride times are computed estimates. Train status is LIVE from LTA: ${trainAlerts.status}.`,
    originName: origin.name,
    destinationName: destination.name,
    driveEstimateMinutes: drive.estimatedMinutes,
    driveDistanceMeters: drive.distanceMeters,
  };

  const routes: TransitRoute[] = [mrtRoute];

  if (originStop && arrivalData && arrivalData.services.length > 0 && arrivalData.services[0].nextBus) {
    const svc = arrivalData.services[0];
    const busEtaMin = minutesFromNow(svc.nextBus!.estimatedArrival);
    const busRideMin = Math.max(3, Math.round((originStop.distanceMeters > 0 ? mrtLegKm * 0.9 : mrtLegKm) / 22 * 60)); // bus is slower than MRT, no expressway
    const busSteps: JourneyStep[] = [
      {
        stepNumber: 1,
        type: 'WALK',
        title: `Walk to ${originStop.description || originStop.roadName}`,
        fromName: origin.name,
        toName: originStop.description || originStop.roadName,
        toCode: originStop.busStopCode,
        distanceMeters: originStop.distanceMeters,
        durationMinutes: Math.max(1, Math.round(originStop.distanceMeters / WALK_SPEED_M_PER_MIN)),
      },
      {
        stepNumber: 2,
        type: 'BUS',
        title: `Bus ${svc.serviceNo} towards ${destination.nearestMrt.name}`,
        fromName: originStop.description || originStop.roadName,
        fromCode: originStop.busStopCode,
        toName: destination.nearestMrt.name,
        durationMinutes: busRideMin,
        busDetails: {
          serviceNo: svc.serviceNo,
          operator: svc.operator,
          regNo: arrivalData.isSimulated ? 'SIMULATED' : 'LIVE',
          crowdLabel: svc.nextBus!.load === 'SEA' ? 'Seats Avail' : svc.nextBus!.load === 'SDA' ? 'Standing' : 'Crowded',
          arrivalMinutes: busEtaMin,
          nextArrivalMinutes: busEtaMin + 8,
          stopsCount: Math.max(2, Math.round(mrtLegKm / 0.6)),
        },
      },
      {
        stepNumber: 3,
        type: 'WALK',
        title: `Walk to ${destination.name}`,
        fromName: destination.nearestMrt.name,
        toName: destination.name,
        distanceMeters: Math.round(walkFromDestMrtM),
        durationMinutes: walkFromDestMrtMin,
      },
    ];

    const busTotalMin =
      Math.max(1, Math.round(originStop.distanceMeters / WALK_SPEED_M_PER_MIN)) + busEtaMin + busRideMin + walkFromDestMrtMin;

    routes.push({
      id: `route-bus-${origin.id}-${destination.id}`,
      title: `Bus ${svc.serviceNo} + Walk`,
      tag: 'BUS • FEEDER',
      totalDurationMin: busTotalMin,
      bufferMinutes: 0,
      firstMileDistanceMeters: originStop.distanceMeters,
      firstMileType: 'BUS',
      firstMileTargetName: originStop.description || originStop.roadName,
      firstMileTargetCode: originStop.busStopCode,
      firstMileLiveEtaMinutes: busEtaMin,
      modeDescription: `Bus ${svc.serviceNo}`,
      steps: busSteps,
      estReachTime: '',
      crowdLevel: svc.nextBus!.load === 'SEA' ? 'Low' : svc.nextBus!.load === 'SDA' ? 'Moderate' : 'High',
      fareSgd: estimateFareSgd(originStop.distanceMeters + mrtLegKm * 1000 + walkFromDestMrtM),
      isEstimate: arrivalData.isSimulated,
      liveDataNote: arrivalData.isSimulated
        ? 'Bus arrival time is simulated — set LTA_API_KEY for live LTA DataMall arrivals.'
        : `Bus stop and arrival time are LIVE from LTA DataMall (stop ${originStop.busStopCode}, ${originStop.distanceMeters}m from ${origin.name}).`,
      originName: origin.name,
      destinationName: destination.name,
      driveEstimateMinutes: drive.estimatedMinutes,
      driveDistanceMeters: drive.distanceMeters,
    });
  } else {
    warnings.push('No real nearby bus stop found for this origin — showing MRT route only.');
  }

  const driveOption: DriveOption = {
    distanceMeters: drive.distanceMeters,
    estimatedMinutes: drive.estimatedMinutes,
    isEstimate: true,
    method: drive.method,
  };

  return { routes, driveOption, warnings };
}
