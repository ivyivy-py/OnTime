/**
 * @file api/bus-arrival.js
 * Vercel Serverless Function: live Singapore LTA DataMall v3 BusArrival lookup.
 *
 * GET /api/bus-arrival?BusStopCode=76059[&ServiceNo=65]
 *
 * Ethical-guardrail note: when no LTA_API_KEY is configured this endpoint
 * returns clearly-labeled simulated data (isSimulated: true) instead of
 * silently pretending to be live. It never fabricates a "verified" source.
 */

const getOperator = (svc) => {
  const s = String(svc).toUpperCase();
  if (['106', '66', '78', '79', '97', '98', '143', '183', '333', '334', '335', '857', '857B'].includes(s)) return 'TTS';
  if (['12', '12E', '34', '36', '36A', '36B', '43', '62', '82', '83', '84', '85', '118', '119', '136', '381', '382', '386', '660', '663', '665'].includes(s)) return 'GAS';
  if (['77', '167', '190', '61', '67', '75', '176', '178', '180', '184', '187', '188', '700', '850E', '854', '856', '858', '900', '901', '903', '911', '912', '913', '920', '922', '925', '950', '951E', '960', '961', '962', '963', '964', '965', '966', '969', '970', '972', '975', '980', '983', '985'].includes(s)) return 'SMRT';
  return 'SBST';
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const busStopCode = String(req.query?.BusStopCode || req.query?.busStopCode || '').trim();
  const serviceNo = String(req.query?.ServiceNo || req.query?.serviceNo || '').trim();

  if (!busStopCode) {
    return res.status(400).json({ error: 'BusStopCode query parameter is required' });
  }

  const ltaApiKey = process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY;

  if (ltaApiKey && ltaApiKey.trim() !== '') {
    try {
      let ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
      if (serviceNo) {
        ltaUrl += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
      }

      const response = await fetch(ltaUrl, {
        headers: {
          AccountKey: ltaApiKey.trim(),
          accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const services = (data.Services || []).map((s) => ({
          serviceNo: s.ServiceNo,
          operator: s.Operator,
          nextBus: s.NextBus?.EstimatedArrival
            ? {
                estimatedArrival: s.NextBus.EstimatedArrival,
                load: s.NextBus.Load,
                feature: s.NextBus.Feature,
                type: s.NextBus.Type,
                regNo: s.NextBus.VisitNumber ? undefined : s.NextBus.OriginCode,
              }
            : undefined,
          nextBus2: s.NextBus2?.EstimatedArrival
            ? {
                estimatedArrival: s.NextBus2.EstimatedArrival,
                load: s.NextBus2.Load,
                feature: s.NextBus2.Feature,
                type: s.NextBus2.Type,
              }
            : undefined,
          nextBus3: s.NextBus3?.EstimatedArrival
            ? {
                estimatedArrival: s.NextBus3.EstimatedArrival,
                load: s.NextBus3.Load,
                feature: s.NextBus3.Feature,
                type: s.NextBus3.Type,
              }
            : undefined,
        }));

        return res.status(200).json({
          busStopCode,
          services,
          isSimulated: false,
          source: 'LTA DataMall v3 BusArrival',
          timestamp: new Date().toISOString(),
        });
      }
      console.warn('LTA DataMall BusArrival responded with status', response.status);
    } catch (err) {
      console.warn('LTA DataMall BusArrival fetch error:', err?.message || err);
    }
  }

  // Graceful, explicitly-labeled simulation fallback (no LTA_API_KEY configured,
  // or the live call failed) — deterministic per stop so the UI doesn't flicker.
  const genericServices = serviceNo ? [serviceNo] : ['7', '14', '65', '106', '147', '190'];
  const now = Date.now();
  const stopHash = busStopCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const simulated = genericServices.map((svc, i) => {
    const svcHash = String(svc).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseOffsetMinutes = ((stopHash + svcHash + i * 3) % 10) + 1;
    return {
      serviceNo: svc,
      operator: getOperator(svc),
      nextBus: {
        estimatedArrival: new Date(now + baseOffsetMinutes * 60 * 1000).toISOString(),
        load: ['SEA', 'SEA', 'SDA', 'LSD'][(stopHash + i) % 4],
        feature: 'WAB',
        type: i % 2 === 0 ? 'DD' : 'SD',
      },
      nextBus2: {
        estimatedArrival: new Date(now + (baseOffsetMinutes + 8 + (i % 4)) * 60 * 1000).toISOString(),
        load: ['SEA', 'SDA', 'SEA', 'LSD'][(stopHash + i + 1) % 4],
      },
    };
  });

  return res.status(200).json({
    busStopCode,
    services: simulated,
    isSimulated: true,
    message: 'Simulated data. Set the LTA_API_KEY environment variable in Vercel for the live Singapore LTA DataMall feed.',
    timestamp: new Date().toISOString(),
  });
}
