/**
 * @file api/train-alerts.js
 * Vercel Serverless Function: live Singapore LTA DataMall TrainServiceAlerts.
 *
 * GET /api/train-alerts
 *
 * Replaces the old api/insight.js, which returned a hardcoded, never-changing
 * "incident" payload while falsely labeling it verifiedSource. This endpoint
 * either returns the real current LTA alert status, or — when no key is
 * configured — says so plainly instead of inventing incidents.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ltaApiKey = (process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY || '').trim();

  if (!ltaApiKey) {
    return res.status(200).json({
      status: 'Unavailable',
      lines: [],
      isSimulated: true,
      message: 'Set the LTA_API_KEY environment variable in Vercel for live MRT service alerts.',
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch('https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts', {
      headers: { AccountKey: ltaApiKey, accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`LTA TrainServiceAlerts responded ${response.status}`);
    }

    const data = await response.json();
    const value = data.Value || {};
    // LTA returns Status 1 = Normal Service, 2 = Disrupted.
    const isNormal = value.Status === 1 || value.Status === undefined;
    const affectedLines = (value.AffectedSegments || []).map((seg) => ({
      line: seg.Line,
      direction: seg.Direction,
      stations: seg.Stations,
      freePublicBus: seg.FreePublicBus,
      freeMrtShuttle: seg.FreeMRTShuttle,
    }));

    return res.status(200).json({
      status: isNormal ? 'Normal Service' : 'Disrupted',
      lines: affectedLines,
      isSimulated: false,
      source: 'LTA DataMall TrainServiceAlerts',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('TrainServiceAlerts fetch error:', err?.message || err);
    return res.status(200).json({
      status: 'Unavailable',
      lines: [],
      isSimulated: true,
      message: 'Could not reach LTA TrainServiceAlerts right now.',
      generatedAt: new Date().toISOString(),
    });
  }
}
