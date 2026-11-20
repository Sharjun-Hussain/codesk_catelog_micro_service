const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10);
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

const rateLimiterMemory = new RateLimiterMemory({
  points: maxRequests,
  duration: Math.floor(windowMs / 1000)
});

const rateLimiter = async (req, res, next) => {
  try {
    // Key by IP or client API key
    const clientKey = req.headers['x-api-key'] ? `api_${req.headers['x-api-key'].slice(0, 8)}` : req.ip;
    await rateLimiterMemory.consume(clientKey);
    next();
  } catch (rateLimiterRes) {
    logger.warn(`[RateLimit Exceeded] IP/Key: ${req.ip} path: ${req.originalUrl}`);
    const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(retryAfter));
    res.set('X-RateLimit-Reset', String(retryAfter));
    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please slow down.',
      retryAfterSeconds: retryAfter
    });
  }
};

module.exports = rateLimiter;

