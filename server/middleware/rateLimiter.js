const rateLimit = require('express-rate-limit');

// Tight limiter for auth endpoints: makes credential stuffing / brute-force
// password guessing impractical. Keyed by IP (express-rate-limit default).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes.' },
});

// Looser general limiter for the rest of the API, mostly to blunt basic
// scripted abuse rather than to constrain normal usage.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
});

module.exports = { authLimiter, apiLimiter };
