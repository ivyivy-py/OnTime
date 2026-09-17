/**
 * @file api/health.js
 * Vercel Serverless Function: Health Check Endpoint
 *
 * This function handles HTTP GET requests sent to /api/health.
 * It returns a simple JSON status object confirming the service is online.
 *
 * @param {import('@vercel/node').VercelRequest} req - The incoming HTTP request from the commuter.
 * @param {import('@vercel/node').VercelResponse} res - The outgoing HTTP response sent back to the browser.
 */
export default function handler(req, res) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');

  // Return HTTP 200 OK with server status and current timestamp
  return res.status(200).json({
    status: 'ok',
    service: 'OnTime SG Transit Engine (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
}
