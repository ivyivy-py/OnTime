/**
 * @file api/excuse.js
 * Vercel Serverless Function: Gemini Singlish WhatsApp Excuse Generator
 *
 * This function accepts POST requests from the client containing commuter details
 * (such as destination, arrival target, delay in minutes, recipient tone, and spice level)
 * and generates a culturally authentic Singaporean WhatsApp message using the Gemini API.
 *
 * @param {import('@vercel/node').VercelRequest} req - The incoming HTTP request.
 * @param {import('@vercel/node').VercelResponse} res - The outgoing HTTP response.
 */
export default async function handler(req, res) {
  // Only permit POST requests for excuse generation
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Please send a POST request.' });
  }

  // Set JSON headers
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Extract and sanitize commuter inputs
    const {
      recipient = 'boss',
      spiceLevel = 2,
      origin = 'Tampines Ave 4',
      destination = 'Suntec City Tower 2',
      liveEta = '9:18 AM',
      delayMinutes = 18,
      incidentId = 'DTL-918-LIVE'
    } = req.body || {};

    // 2. Validate input boundaries server-side
    const validRecipients = ['boss', 'colleagues', 'friends'];
    const safeRecipient = validRecipients.includes(recipient) ? recipient : 'boss';
    const safeSpiceLevel = [1, 2, 3].includes(Number(spiceLevel)) ? Number(spiceLevel) : 2;

    // 3. Fallback dictionary with verified local Singlish responses
    const localPhrases = {
      boss: {
        1: `Good morning Boss, sincere apologies for the delay. The Downtown Line experienced a technical slowdown and bus transfer is delayed. Live ETA is ${liveEta}. Brisk walking now, thank you for understanding!`,
        2: `Good morning Boss, paiseh! DT Line train got crowd delay and bus transfer jammed at PIE. Currently brisk walking from MRT, live ETA ${liveEta}. Will make up time, thank you boss!`,
        3: `Boss morning! Wah jialat, Downtown Line got big signalling headache then bus stuck in jam. Currently sprinting like marathon runners, ETA ${liveEta} confirm reach chop-chop! Paiseh boss!`
      },
      colleagues: {
        1: `Morning guys, train signalling issue on DTL + jam at transfer bus. Revised ETA around ${liveEta}, go ahead with the standup first!`,
        2: `Guys, paiseh! DTL packed like sardine and Bus 65 stuck in jam. Live ETA ${liveEta}, please help me cover 15 mins can? Kopi on me later!`,
        3: `Walao eh everyone, Downtown Line crawl like turtle, then bus 65 also slow! Running now, ETA ${liveEta}. Don't start gossip without me, late fine ready!`
      },
      friends: {
        1: `Sorry guys, delay on Downtown Line and bus transfer. ETA ${liveEta}, see you all shortly!`,
        2: `Alamak kakis, confirm late! SMRT line jam and transfer bus slow motion. ETA ${liveEta}, don't eat all the kaya toast first hor!`,
        3: `Aiyooo level 99 kanchiong now!! MRT delay + bus uncle driving relax relax. Current ETA ${liveEta}, help me chope seat and order iced kopi peng quick!!`
      }
    };

    // 4. If GEMINI_API_KEY is configured in Vercel environment variables, use Google GenAI SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        // Dynamically import the GenAI SDK
        const { GoogleGenAI } = await import('@google/genai');

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const toneGuide =
          safeRecipient === 'boss'
            ? 'Formal Singlish to boss (polite, apologetic, mild Singlish like "paiseh", "boss")'
            : safeRecipient === 'colleagues'
            ? 'Casual Singlish to colleagues (friendly, promise to buy kopi, ask to cover)'
            : 'Super Singlish to close kakis (humorous, dramatic, expressions like "alamak", "kanchiong", "chope seat")';

        const spiceGuide =
          safeSpiceLevel === 1
            ? 'Mild and professional'
            : safeSpiceLevel === 3
            ? 'Level 99 Kanchiong high urgency Singlish'
            : 'Everyday Singaporean conversational Singlish';

        const prompt = `You are a Singaporean commuter going from ${origin} to ${destination}.
You are delayed by ${delayMinutes} mins due to public transport congestion (LTA Incident #${incidentId}).
Your revised ETA is ${liveEta}.
Write a 2-sentence WhatsApp excuse:
- Tone: ${toneGuide}
- Spice Level: ${spiceGuide}
- Return ONLY the exact message text, no quotation marks or meta commentary.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an authentic Singapore commuter writing a quick WhatsApp message. Never output markdown formatting.',
            temperature: 0.8
          }
        });

        const generatedText = response.text ? response.text.trim() : null;
        if (generatedText) {
          return res.status(200).json({
            message: generatedText,
            recipient: safeRecipient,
            spiceLevel: safeSpiceLevel,
            incidentId,
            generatedByAi: true
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, reverting to local Singlish templates:', geminiError);
      }
    }

    // 5. Fallback return
    const fallbackText = localPhrases[safeRecipient][safeSpiceLevel];
    return res.status(200).json({
      message: fallbackText,
      recipient: safeRecipient,
      spiceLevel: safeSpiceLevel,
      incidentId,
      generatedByAi: false
    });
  } catch (error) {
    console.error('Error generating excuse:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
