/**
 * @file api/nearby-stops.js
 * Vercel Serverless Function: nearest real LTA bus stop(s) to a given
 * lat/lon, using LTA DataMall's official /BusStops directory.
 *
 * GET /api/nearby-stops?lat=1.3496&lon=103.9568&limit=3
 *
 * Ethical-guardrail note: this deliberately does NOT hardcode guessed bus
 * stop codes anywhere in the app. Every BusStopCode this app ever shows or
 * queries live arrivals for comes from this real LTA directory. When no
 * LTA_API_KEY is configured (or the directory can't be fetched), it returns
 * an empty, clearly-labeled result rather than inventing a plausible-looking
 * stop code.
 */

const EARTH_RADIUS_M = 6371000;
function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Module-scope cache: persists across warm invocations of the same
// serverless instance (not guaranteed across cold starts). Avoids
// re-fetching ~5,000 bus stops on every request.
let cachedStops = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — LTA's stop directory changes rarely.
const MAX_PAGES = 20; // safety cap: 20 * 500 = 10,000 stops, well above LTA's ~5,100.

async function fetchAllBusStops(ltaApiKey) {
  const now = Date.now();
  if (cachedStops && now - cachedAt < CACHE_TTL_MS) {
    return cachedStops;
  }

  const stops = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const skip = page * 500;
    const url = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`;
    const response = await fetch(url, {
      headers: { AccountKey: ltaApiKey, accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`LTA BusStops directory responded ${response.status} at skip=${skip}`);
    }
    const data = await response.json();
    const batch = data.value || [];
    if (batch.length === 0) break;
    for (const s of batch) {
      stops.push({
        busStopCode: s.BusStopCode,
        roadName: s.RoadName,
        description: s.Description,
        lat: s.Latitude,
        lon: s.Longitude,
      });
    }
    if (batch.length < 500) break; // last page
  }

  cachedStops = stops;
  cachedAt = now;
  return stops;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const lat = parseFloat(req.query?.lat);
  const lon = parseFloat(req.query?.lon);
  const limit = Math.min(parseInt(req.query?.limit, 10) || 3, 10);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query parameters are required numbers' });
  }

  const ltaApiKey = (process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY || '').trim();

  if (!ltaApiKey) {
    return res.status(200).json({
      stops: [],
      isSimulated: true,
      message: 'Set the LTA_API_KEY environment variable in Vercel to look up real nearby bus stops.',
    });
  }

  try {
    const allStops = await fetchAllBusStops(ltaApiKey);
    const nearest = allStops
      .map((s) => ({ ...s, distanceMeters: Math.round(haversineMeters(lat, lon, s.lat, s.lon)) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);

    return res.status(200).json({
      stops: nearest,
      isSimulated: false,
      source: 'LTA DataMall BusStops directory',
      totalStopsIndexed: allStops.length,
    });
  } catch (err) {
    console.warn('nearby-stops lookup failed:', err?.message || err);
    return res.status(200).json({
      stops: [],
      isSimulated: true,
      message: 'Could not reach the LTA BusStops directory right now.',
    });
  }
}
