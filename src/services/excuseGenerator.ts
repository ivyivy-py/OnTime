/**
 * @file excuseGenerator.ts
 * Communicates with the backend serverless endpoint /api/gemini/excuse
 * to generate authentic Singlish WhatsApp excuses with reliable offline fallback.
 */

import { ExcuseRequest, ExcuseResponse } from '../types';

/** Fallback curated messages matching Singapore colloquial nuances */
export const LOCAL_EXCUSES = {
  boss: {
    1: "Good morning Boss, sincere apologies for the delay. The Downtown Line experienced a technical slowdown and the bus connection is delayed. Live ETA is {LIVE_ETA}. Brisk walking now, thank you for understanding!",
    2: "Good morning Boss, paiseh! DT Line train got crowd delay and bus transfer jammed at PIE. Currently brisk walking from MRT, live ETA {LIVE_ETA}. Will make up time, thank you boss!",
    3: "Boss morning! Wah jialat, Downtown Line got big signalling headache then bus stuck in jam. Currently sprinting like marathon runners, ETA {LIVE_ETA} confirm reach chop-chop! Paiseh boss!"
  },
  colleagues: {
    1: "Morning guys, train signalling issue on DTL + jam at transfer bus. Revised ETA around {LIVE_ETA}, go ahead with the standup first!",
    2: "Guys, paiseh! DTL packed like sardine and Bus 65 stuck in jam. Live ETA {LIVE_ETA}, please help me cover 15 mins can? Kopi on me later!",
    3: "Walao eh everyone, Downtown Line crawl like turtle, then bus 65 also slow! Running now, ETA {LIVE_ETA}. Don't start gossip without me, late fine ready!"
  },
  friends: {
    1: "Sorry guys, delay on Downtown Line and bus transfer. ETA {LIVE_ETA}, see you all shortly!",
    2: "Alamak kakis, confirm late! SMRT line jam and transfer bus slow motion. ETA {LIVE_ETA}, don't eat all the kaya toast first hor!",
    3: "Aiyooo level 99 kanchiong now!! MRT delay + bus uncle driving relax relax. Current ETA {LIVE_ETA}, help me chope seat and order iced kopi peng quick!!"
  }
};

/**
 * Calls Gemini serverless API or uses contextual fallback
 */
export async function generateSinglishExcuse(req: ExcuseRequest): Promise<ExcuseResponse> {
  const incidentId = req.incidentId || `DTL-${Math.floor(Math.random() * 900 + 100)}-LIVE`;

  try {
    const res = await fetch('/api/gemini/excuse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.message) {
        return {
          message: data.message,
          tone: req.recipient,
          spiceLevel: req.spiceLevel,
          incidentId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generatedByAi: true
        };
      }
    }
  } catch (err) {
    console.warn('Backend Gemini call unavailable, using local curated Singlish engine', err);
  }

  // Fallback to local curated Singlish engine
  const toneMap = LOCAL_EXCUSES[req.recipient] || LOCAL_EXCUSES.boss;
  const rawTemplate = toneMap[req.spiceLevel] || toneMap[2];
  const formatted = rawTemplate
    .replace('{LIVE_ETA}', req.liveEta || '9:18 AM')
    .replace('{DELAY}', String(req.delayMinutes || 18));

  return {
    message: formatted,
    tone: req.recipient,
    spiceLevel: req.spiceLevel,
    incidentId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    generatedByAi: false
  };
}
