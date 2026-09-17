/**
 * @file server.ts
 * Express application running on port 3000 that handles backend serverless routes
 * (/api/health, /api/gemini/excuse) and serves the Vite client in development & production.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Parse JSON request payloads
app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

/**
 * Health check endpoint
 * Used for uptime verification and deployment liveness checks.
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OnTime SG Transit Engine',
    timestamp: new Date().toISOString()
  });
});

/**
 * Gemini Singlish Excuse Generator API Endpoint
 * Generates context-aware, authentic Singaporean WhatsApp excuses.
 */
app.post(['/api/gemini/excuse', '/api/excuse'], async (req: Request, res: Response) => {
  try {
    const { recipient, spiceLevel, origin, destination, liveEta, delayMinutes, incidentId } = req.body;

    const toneDesc =
      recipient === 'boss'
        ? 'Formal Singlish to your boss (respectful, apologetic, using mild Singlish like "paiseh", "boss", "traffic jammed")'
        : recipient === 'colleagues'
        ? 'Casual Singlish to colleagues/team (friendly, asking them to cover standup, promising kopi later)'
        : 'Super Singlish to close kakis/friends (dramatic, humorous, using terms like "alamak", "walao", "kanchiong", "chope seat", "kopi peng")';

    const spiceDesc =
      spiceLevel === 1
        ? 'Mild and safe (mostly standard English with light Singaporean cadence)'
        : spiceLevel === 3
        ? 'Level 99 Kanchiong (very expressive Singlish, high urgency, humorous Singaporean slang)'
        : 'Standard Singaporean everyday phrasing';

    const prompt = `You are a Singaporean commuter travelling from ${origin || 'Tampines'} to ${destination || 'Suntec City'}.
You are delayed by ${delayMinutes || 18} minutes due to a public transit slowdown (Incident ID #${incidentId || 'DTL-918-LIVE'}).
Your revised live ETA is ${liveEta || '9:18 AM'}.
Draft a realistic, natural WhatsApp excuse message following these instructions:
- Target Recipient Tone: ${toneDesc}
- Singlish Spice Level: ${spiceDesc}
- Length: 2 to 3 punchy sentences maximum.
- Do NOT include quotes, placeholders, or preamble. Just the raw WhatsApp text ready to send.`;

    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an authentic Singaporean commuter writing a natural WhatsApp excuse for transit delays. Never lecture or break character.',
          temperature: 0.8
        }
      });

      const message = response.text ? response.text.trim() : '';
      if (message) {
        return res.json({
          message,
          recipient,
          spiceLevel,
          incidentId: incidentId || 'DTL-918-LIVE',
          generatedByAi: true
        });
      }
    }

    // Fallback when API key is missing
    const fallbackMessages: Record<string, Record<number, string>> = {
      boss: {
        1: `Good morning Boss, sincere apologies for the delay. The transit line experienced a technical slowdown. Live ETA is ${liveEta || '9:18 AM'}. Brisk walking now, thank you for understanding!`,
        2: `Good morning Boss, paiseh! DT Line train got crowd delay and bus transfer jammed at PIE. Currently brisk walking from MRT, live ETA ${liveEta || '9:18 AM'}. Will make up time, thank you boss!`,
        3: `Boss morning! Wah jialat, Downtown Line got big signalling headache then bus stuck in jam. Currently sprinting like marathon runners, ETA ${liveEta || '9:18 AM'} confirm reach chop-chop! Paiseh boss!`
      },
      colleagues: {
        1: `Morning guys, train signalling issue on DTL + jam at transfer bus. Revised ETA around ${liveEta || '9:18 AM'}, go ahead with the standup first!`,
        2: `Guys, paiseh! DTL packed like sardine and Bus 65 stuck in jam. Live ETA ${liveEta || '9:18 AM'}, please help me cover 15 mins can? Kopi on me later!`,
        3: `Walao eh everyone, Downtown Line crawl like turtle, then bus 65 also slow! Running now, ETA ${liveEta || '9:18 AM'}. Don't start gossip without me, late fine ready!`
      },
      friends: {
        1: `Sorry guys, delay on Downtown Line and bus transfer. ETA ${liveEta || '9:18 AM'}, see you all shortly!`,
        2: `Alamak kakis, confirm late! SMRT line jam and transfer bus slow motion. ETA ${liveEta || '9:18 AM'}, don't eat all the kaya toast first hor!`,
        3: `Aiyooo level 99 kanchiong now!! MRT delay + bus uncle driving relax relax. Current ETA ${liveEta || '9:18 AM'}, help me chope seat and order iced kopi peng quick!!`
      }
    };

    const targetTone = fallbackMessages[recipient] || fallbackMessages.boss;
    const fallbackMsg = targetTone[spiceLevel] || targetTone[2];

    return res.json({
      message: fallbackMsg,
      recipient,
      spiceLevel,
      incidentId: incidentId || 'DTL-918-LIVE',
      generatedByAi: false
    });
  } catch (error) {
    console.error('Gemini excuse error:', error);
    res.status(500).json({ error: 'Failed to generate excuse message' });
  }
});

// Configure Vite middleware in development vs static file serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OnTime SG Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
