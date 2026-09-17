/**
 * @file transitData.ts
 * Real-world Singapore transit presets, bus/MRT datasets, and route definitions
 * adhering to LTA DataMall v3 patterns and the Singapore OnTime SG UI designs.
 */

import { TransitRoute } from '../types';

/** Quick location presets for origin and destination */
export interface LocationPreset {
  id: string;
  name: string;
  type: 'home' | 'office' | 'mrt' | 'landmark';
  description: string;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { id: 'tampines', name: 'Tampines (Home)', type: 'home', description: 'Tampines Ave 4 / Stn' },
  { id: 'suntec', name: 'Suntec City (Office)', type: 'office', description: 'Suntec Tower 2 / Promenade' },
  { id: 'bugis', name: 'Bugis Junction', type: 'mrt', description: 'Bugis MRT Interchange (DTL/EWL)' },
  { id: 'jurong_east', name: 'Jurong East Stn', type: 'mrt', description: 'Jurong East Interchange (NSL/EWL)' },
  { id: 'orchard', name: 'Orchard ION', type: 'landmark', description: 'Orchard MRT (NSL/TEL)' },
  { id: 'mbs', name: 'Marina Bay Sands', type: 'office', description: 'Bayfront MRT (DTL/CCL)' },
  { id: 'bedok', name: 'Bedok Reservoir', type: 'mrt', description: 'Bedok Reservoir Stn Exit B' },
  { id: 'changi', name: 'Changi Airport T3', type: 'landmark', description: 'Airport Boulevard' }
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
      icon: 'sprint'
    };
  } else {
    return {
      isUrgent: false,
      text: `Just Stroll (${distanceMeters}m)`,
      shortText: 'Just stroll, steady pom pi pi',
      cadence: 60,
      description: 'Relaxed walking pace, ample buffer to platform.',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20',
      icon: 'spa'
    };
  }
}

/** Pre-calculated realistic Singapore commuter routes */
export const SAMPLE_ROUTES: TransitRoute[] = [
  {
    id: 'route-bus65-dtl',
    title: 'Bus 65 + Downtown Line',
    tag: 'RECOMMENDED • FASTEST',
    totalDurationMin: 34,
    bufferMinutes: 8,
    firstMileDistanceMeters: 180,
    firstMileType: 'BUS',
    firstMileTargetName: 'Opp Tampines Stn',
    firstMileTargetCode: 'B76149',
    firstMileLiveEtaMinutes: 2,
    secondMileLiveEtaMinutes: 2,
    modeDescription: '1 Bus + 1 MRT',
    estReachTime: '8:52 AM',
    crowdLevel: 'Low',
    fareSgd: 1.84,
    steps: [
      {
        stepNumber: 1,
        type: 'BUS',
        title: 'Step 1: First Mile Bus',
        fromName: 'Opp Tampines Stn',
        fromCode: 'B76149',
        toName: 'Bedok Reservoir Stn',
        toCode: 'B84009',
        distanceMeters: 180,
        durationMinutes: 14,
        busDetails: {
          serviceNo: '65',
          operator: 'SBS Transit',
          regNo: 'SBS8921T',
          crowdLabel: 'Seats Avail',
          arrivalMinutes: 2,
          nextArrivalMinutes: 9,
          stopsCount: 8
        }
      },
      {
        stepNumber: 2,
        type: 'MRT',
        title: 'Step 2: Downtown Line MRT',
        fromName: 'Bedok Reservoir',
        fromCode: 'DT30',
        toName: 'Promenade',
        toCode: 'DT15',
        distanceMeters: 60,
        durationMinutes: 18,
        sheltered: true,
        mrtDetails: {
          lineCode: 'DT30',
          lineName: 'Downtown Line',
          lineColor: '#00519f',
          stationName: 'Bedok Reservoir',
          destStationName: 'Promenade (Suntec)',
          direction: 'Towards Bukit Panjang',
          arrivalMinutes: 2,
          platform: 'Platform B',
          doorInfo: 'Door 03 • Fastest escalator exit at Promenade',
          stopsCount: 6
        }
      }
    ]
  },
  {
    id: 'route-ewl-ccl',
    title: 'East-West Line + Circle Line',
    tag: 'ALL-TRAIN OPTION',
    totalDurationMin: 38,
    bufferMinutes: 4,
    firstMileDistanceMeters: 80,
    firstMileType: 'MRT',
    firstMileTargetName: 'Tampines MRT Exit C',
    firstMileTargetCode: 'EW2',
    firstMileLiveEtaMinutes: 3,
    secondMileLiveEtaMinutes: 4,
    modeDescription: '2 MRT Transfers',
    estReachTime: '8:56 AM',
    crowdLevel: 'Moderate',
    fareSgd: 1.92,
    steps: [
      {
        stepNumber: 1,
        type: 'MRT',
        title: 'Step 1: East-West Line',
        fromName: 'Tampines MRT',
        fromCode: 'EW2',
        toName: 'Paya Lebar Interchange',
        toCode: 'EW8 / CC9',
        distanceMeters: 80,
        durationMinutes: 16,
        sheltered: true,
        mrtDetails: {
          lineCode: 'EW2',
          lineName: 'East-West Line',
          lineColor: '#059669',
          stationName: 'Tampines',
          destStationName: 'Paya Lebar',
          direction: 'Towards Tuas Link',
          arrivalMinutes: 3,
          platform: 'Platform A',
          doorInfo: 'Door 06 • Near interchange linkway',
          stopsCount: 6
        }
      },
      {
        stepNumber: 2,
        type: 'MRT',
        title: 'Step 2: Circle Line to Promenade',
        fromName: 'Paya Lebar',
        fromCode: 'CC9',
        toName: 'Promenade',
        toCode: 'CC4',
        distanceMeters: 45,
        durationMinutes: 12,
        sheltered: true,
        mrtDetails: {
          lineCode: 'CC9',
          lineName: 'Circle Line',
          lineColor: '#eab308',
          stationName: 'Paya Lebar',
          destStationName: 'Promenade',
          direction: 'Towards Marina Bay / Dhoby Ghaut',
          arrivalMinutes: 4,
          platform: 'Platform B',
          doorInfo: 'Door 02 • Direct access to Suntec City underpass',
          stopsCount: 4
        }
      }
    ]
  },
  {
    id: 'route-direct-bus-518',
    title: 'Express Bus 518 Direct',
    tag: 'SINGLE SEAT • NO TRANSFER',
    totalDurationMin: 42,
    bufferMinutes: 1,
    firstMileDistanceMeters: 280,
    firstMileType: 'BUS',
    firstMileTargetName: 'Blk 938 Tampines Ave 5',
    firstMileTargetCode: 'B76189',
    firstMileLiveEtaMinutes: 4,
    modeDescription: 'Direct Highway Express',
    estReachTime: '8:59 AM',
    crowdLevel: 'Moderate',
    fareSgd: 2.45,
    steps: [
      {
        stepNumber: 1,
        type: 'BUS',
        title: 'Step 1: Direct Express Bus',
        fromName: 'Blk 938 Tampines Ave 5',
        fromCode: 'B76189',
        toName: 'Suntec Convention Ctr',
        toCode: 'B02151',
        distanceMeters: 280,
        durationMinutes: 38,
        busDetails: {
          serviceNo: '518',
          operator: 'SBS Transit',
          regNo: 'SBS6820L',
          crowdLabel: 'Standing',
          arrivalMinutes: 4,
          nextArrivalMinutes: 16,
          stopsCount: 14
        }
      }
    ]
  }
];
