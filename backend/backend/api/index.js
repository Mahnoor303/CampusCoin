/**
 * Vercel Serverless entry point — MUST live in `api/` (Vercel only scans a
 * top-level `api/` directory for functions).
 *
 * Why: Vercel's free tier (no credit card) runs Node.js as serverless functions,
 * not long-running servers — so instead of app.listen(), we hand each incoming
 * request to the existing Express app via the http server's 'request' event.
 * Zero new dependencies; the Express app is reused unchanged.
 */
const http = require('http');

const app = require('../src/app');

const server = http.createServer(app);

// Eager, cached Mongo connect: mongoose pools connections across invocations
// inside a warm lambda, so DB handshake doesn't add latency to every request.
const { connectDB } = require('../src/config/db');
let dbReady = false;
connectDB()
  .then(() => {
    dbReady = true;
    console.log('[Serverless] MongoDB connected (warm)');
  })
  .catch((err) => console.error(`[Serverless] MongoDB connect failed: ${err.message}`));

module.exports = async function handler(req, res) {
  // Keep the invocation alive until Express finishes writing the response
  // (covers slower requests like CSV import or PDF/report generation).
  await new Promise((resolve) => {
    res.on('close', resolve);
    server.emit('request', req, res);
  });
};

// Exported for tests/debug — not used by Vercel.
module.exports.__isDbReady = () => dbReady;
