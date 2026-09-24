/**
 * @file types.ts
 * Data structures for OnTime SG transit planner, pacing engine, and Gemini excuse generator.
 */

/** Single bus arrival information conforming to LTA DataMall v3 schema */
export interface BusArrivalInfo {
  serviceNo: string;
  operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS';
  nextBus: {
    estimatedArrival: string; // ISO 8601 string
    minutesToArrival: number;
    load: 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
    feature: 'WAB' | ''; // Wheelchair Accessible Bus
    type: 'SD' | 'DD' | 'BD'; // Single deck, Double deck, Bendy
    regNo?: string;
  };
  nextBus2?: {
    estimatedArrival: string;
    minutesToArrival: number;
    load: 'SEA' | 'SDA' | 'LSD';
  };
}

/** MRT station node information */
export interface MrtStation {
  code: string; // e.g., "DT30", "EW2", "CC4"
  name: string; // e.g., "Bedok Reservoir", "Tampines", "Promenade"
  line: 'DTL' | 'EWL' | 'NSL' | 'CCL' | 'TEL' | 'NEL';
  lineName: string;
  lineColor: string;
  exit?: string;
  platform?: string;
  direction?: string;
  doorRecommendation?: string;
  nextTrainMin: number;
}

/** Step in a transit journey */
export interface JourneyStep {
  stepNumber: number;
  type: 'WALK' | 'BUS' | 'MRT' | 'CAR';
  title: string;
  fromName: string;
  fromCode?: string;
  toName: string;
  toCode?: string;
  distanceMeters?: number;
  durationMinutes: number;
  sheltered?: boolean;
  busDetails?: {
    serviceNo: string;
    operator: string;
    regNo: string;
    crowdLabel: 'Seats Avail' | 'Standing' | 'Crowded';
    arrivalMinutes: number;
    nextArrivalMinutes: number;
    stopsCount: number;
  };
  mrtDetails?: {
    lineCode: string;
    lineName: string;
    lineColor: string;
    stationName: string;
    destStationName: string;
    direction: string;
    arrivalMinutes: number;
    platform: string;
    doorInfo: string;
    stopsCount: number;
  };
}

/** Complete planned route option */
export interface TransitRoute {
  id: string;
  title: string;
  tag?: string;
  totalDurationMin: number;
  bufferMinutes: number;
  firstMileDistanceMeters: number;
  firstMileType: 'BUS' | 'MRT' | 'WALK';
  firstMileTargetName: string;
  firstMileTargetCode: string;
  firstMileLiveEtaMinutes: number;
  secondMileLiveEtaMinutes?: number;
  modeDescription: string;
  steps: JourneyStep[];
  estReachTime: string;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  fareSgd: number;
  /** True when totalDurationMin/etc. are computed estimates rather than pulled from a live feed. */
  isEstimate?: boolean;
  /** Human-readable note on what's live vs estimated in this route, shown in the UI. */
  liveDataNote?: string;
  /** Display names for the trip's endpoints, e.g. "Tampines (Home)" / "Suntec City (Office)". */
  originName?: string;
  destinationName?: string;
  /** Same-trip car estimate, attached so ActiveRideView can show it without extra plumbing. */
  driveEstimateMinutes?: number;
  driveDistanceMeters?: number;
}

/** A "drive it yourself" timing option — always a computed estimate, never live traffic. */
export interface DriveOption {
  distanceMeters: number;
  estimatedMinutes: number;
  isEstimate: true;
  method: string;
}

/**
 * What triggered a hop to the Late Lah! AI tab — carries the REAL pacing
 * state (not a hardcoded assumption of lateness) so that tab can show an
 * "I'm on my way" check-in instead of manufacturing an excuse when the
 * plan is actually on time.
 */
export interface ExcuseTrigger {
  isLate: boolean;
  delayMinutes: number;
  /** The route's actual estimated-reach time, e.g. "8:52 AM". */
  etaFormatted: string;
}

/** Excuse generation payload */
export interface ExcuseRequest {
  recipient: 'boss' | 'colleagues' | 'friends';
  spiceLevel: 1 | 2 | 3; // 1 = Mild, 2 = Standard Lah, 3 = Level 99 Kanchiong
  origin: string;
  destination: string;
  targetTime: string;
  liveEta: string;
  delayMinutes: number;
  incidentId: string;
  transportLines: string[];
}

/** Excuse response payload */
export interface ExcuseResponse {
  message: string;
  tone: string;
  spiceLevel: number;
  incidentId: string;
  timestamp: string;
  generatedByAi: boolean;
}
