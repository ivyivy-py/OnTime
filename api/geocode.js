/**
 * @file api/geocode.js
 * Vercel Serverless Function: real address/location search for Singapore,
 * proxying OneMap Singapore's free public Search API (a Singapore government
 * service — no API key required for basic search).
 *
 * GET /api/geocode?q=tampines%20ave%204
 *
 * Ethical-guardrail note: this exists so the Plan tab can accept ANY real
 * Singapore location the user types, instead of being limited to a fixed
 * list of guessed presets. It never invents an address or coordinate — if
 * OneMap can't be reached, it returns an empty result and says so, rather
 * than fabricating a plausible-looking match.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = String(req.query?.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(200).json({ results: [], isSimulated: false });
  }

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      query
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const response = await fetch(url, { headers: { accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`OneMap search responded ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).slice(0, 8).map((r) => ({
      name: r.SEARCHVAL,
      address: r.ADDRESS,
      lat: parseFloat(r.LATITUDE),
      lon: parseFloat(r.LONGITUDE),
    })).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

    return res.status(200).json({
      results,
      isSimulated: false,
      source: 'OneMap Singapore (onemap.gov.sg) Search API',
    });
  } catch (err) {
    console.warn('OneMap geocode error:', err?.message || err);
    return res.status(200).json({
      results: [],
      isSimulated: true,
      message: 'Could not reach OneMap Singapore right now. Try again, or use one of the quick presets below.',
    });
  }
}
