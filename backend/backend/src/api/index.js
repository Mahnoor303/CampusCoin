/**
 * Vercel Serverless entry point (backend/backend project → /api/* catch-all).
 *
 * Why: Vercel's free tier (no credit card) runs Node.js as serverless functions,
 * not long-running servers — so instead of app.listen(), we hand each incoming
 * request to the existing Express app via the http server's 'request' event.
 * Zero new dependencies; the Express app is reused unchanged.
 */
const http = require('http');

const app = require('../app');

const server = http.createServer(app);

module.exports = async function handler(req, res) {
  // Keep the invocation alive until Express finishes writing the response
  // (covers slower requests like CSV import or PDF/report generation).
  await new Promise((resolve) => {
    res.on('close', resolve);
    server.emit('request', req, res);
  });
};
