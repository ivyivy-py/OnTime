/**
 * @file mrtStations.ts
 * Reference list of MRT/LRT interchange and major stations, used to find the
 * nearest station to ANY point on the island (not just the 8 quick presets).
 *
 * Ethical-guardrail note: LTA DataMall does not publish a simple "all
 * stations with lat/lon" directory the way it does for bus stops (see
 * api/nearby-stops.js, which queries the real /BusStops directory instead of
 * ever hardcoding a stop code). For MRT there is no equivalent free,
 * keyless directory to query live, so this is a curated list of real,
 * named, public stations with approximate coordinates — NOT exhaustive
 * (~35 of the network's 140+ stations), and never presented as live data.
 * It exists only to estimate "which station is closest" for a custom
 * geocoded location; every consumer should treat the resulting distance as
 * an estimate.
 */

export interface NearestMrt {
  code: string;
  name: string;
  /** Line codes serving this station, e.g. ['EW','DT'] for an interchange. */
  lines: string[];
  lat: number;
  lon: number;
}

export const MRT_STATIONS: NearestMrt[] = [
  { code: 'EW2/DT32', name: 'Tampines', lines: ['EW', 'DT'], lat: 1.3527, lon: 103.9448 },
  { code: 'CC4/DT15', name: 'Promenade', lines: ['CC', 'DT'], lat: 1.2934, lon: 103.8607 },
  { code: 'EW12/DT14', name: 'Bugis', lines: ['EW', 'DT'], lat: 1.3006, lon: 103.8559 },
  { code: 'NS1/EW24', name: 'Jurong East', lines: ['NS', 'EW'], lat: 1.3329, lon: 103.7436 },
  { code: 'NS22/TE14', name: 'Orchard', lines: ['NS', 'TE'], lat: 1.3040, lon: 103.8318 },
  { code: 'CE1/DT16', name: 'Bayfront', lines: ['CE', 'DT'], lat: 1.2823, lon: 103.8587 },
  { code: 'DT30', name: 'Bedok Reservoir', lines: ['DT'], lat: 1.3363, lon: 103.9326 },
  { code: 'CG2', name: 'Changi Airport', lines: ['CG'], lat: 1.3572, lon: 103.9885 },
  { code: 'NS25/EW13', name: 'City Hall', lines: ['NS', 'EW'], lat: 1.2931, lon: 103.8520 },
  { code: 'NS26/EW14', name: 'Raffles Place', lines: ['NS', 'EW'], lat: 1.2836, lon: 103.8515 },
  { code: 'NS24/NE6/CC1', name: 'Dhoby Ghaut', lines: ['NS', 'NE', 'CC'], lat: 1.2996, lon: 103.8455 },
  { code: 'EW16/NE3/TE17', name: 'Outram Park', lines: ['EW', 'NE', 'TE'], lat: 1.2802, lon: 103.8396 },
  { code: 'NE4/DT19', name: 'Chinatown', lines: ['NE', 'DT'], lat: 1.2846, lon: 103.8443 },
  { code: 'NE1/CC29', name: 'HarbourFront', lines: ['NE', 'CC'], lat: 1.2653, lon: 103.8220 },
  { code: 'EW8/CC9', name: 'Paya Lebar', lines: ['EW', 'CC'], lat: 1.3179, lon: 103.8925 },
  { code: 'NE12/CC13', name: 'Serangoon', lines: ['NE', 'CC'], lat: 1.3499, lon: 103.8735 },
  { code: 'NS16', name: 'Ang Mo Kio', lines: ['NS'], lat: 1.3699, lon: 103.8496 },
  { code: 'NS17/CC15', name: 'Bishan', lines: ['NS', 'CC'], lat: 1.3512, lon: 103.8486 },
  { code: 'NS19', name: 'Toa Payoh', lines: ['NS'], lat: 1.3326, lon: 103.8474 },
  { code: 'NS21/DT11', name: 'Newton', lines: ['NS', 'DT'], lat: 1.3127, lon: 103.8384 },
  { code: 'NS9/TE2', name: 'Woodlands', lines: ['NS', 'TE'], lat: 1.4370, lon: 103.7865 },
  { code: 'NS13', name: 'Yishun', lines: ['NS'], lat: 1.4295, lon: 103.8350 },
  { code: 'NE17/PTC', name: 'Punggol', lines: ['NE'], lat: 1.4054, lon: 103.9022 },
  { code: 'NE16/STC', name: 'Sengkang', lines: ['NE'], lat: 1.3917, lon: 103.8952 },
  { code: 'EW1', name: 'Pasir Ris', lines: ['EW'], lat: 1.3730, lon: 103.9494 },
  { code: 'EW5', name: 'Bedok', lines: ['EW'], lat: 1.3240, lon: 103.9300 },
  { code: 'EW21/CC22', name: 'Buona Vista', lines: ['EW', 'CC'], lat: 1.3070, lon: 103.7900 },
  { code: 'EW23', name: 'Clementi', lines: ['EW'], lat: 1.3150, lon: 103.7651 },
  { code: 'EW27', name: 'Boon Lay', lines: ['EW'], lat: 1.3387, lon: 103.7065 },
  { code: 'NS4/BP1', name: 'Choa Chu Kang', lines: ['NS'], lat: 1.3854, lon: 103.7443 },
  { code: 'NS27/CE2/TE20', name: 'Marina Bay', lines: ['NS', 'CE', 'TE'], lat: 1.2760, lon: 103.8546 },
  { code: 'CC19/DT9', name: 'Botanic Gardens', lines: ['CC', 'DT'], lat: 1.3225, lon: 103.8153 },
  { code: 'NE7/DT12', name: 'Little India', lines: ['NE', 'DT'], lat: 1.3066, lon: 103.8491 },
  { code: 'EW3', name: 'Simei', lines: ['EW'], lat: 1.3434, lon: 103.9532 },
  { code: 'CG1/DT35', name: 'Expo', lines: ['CG', 'DT'], lat: 1.3345, lon: 103.9617 },
];
