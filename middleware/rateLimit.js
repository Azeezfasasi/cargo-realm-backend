const mongoose = require('mongoose');

// Fixed-window rate limiter backed by MongoDB, so the limit is shared across all
// serverless instances (an in-memory counter would reset per Vercel instance).
const rateLimitSchema = new mongoose.Schema({
  _id: String, // `${name}:${ip}:${window}`
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo deletes expired windows
const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.headers['x-real-ip'] || req.ip || 'unknown';

/**
 * @param {object} opts
 * @param {string} opts.name      Bucket name (separate limits per route)
 * @param {number} opts.max       Requests allowed per window per IP
 * @param {number} opts.windowMs  Window length in milliseconds
 */
module.exports = function rateLimit({ name, max, windowMs }) {
  return async (req, res, next) => {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const key = `${name}:${clientIp(req)}:${window}`;
    try {
      const doc = await RateLimit.findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) } },
        { upsert: true, new: true }
      ).lean();

      const resetSeconds = Math.ceil(((window + 1) * windowMs - now) / 1000);
      res.set('RateLimit-Limit', String(max));
      res.set('RateLimit-Remaining', String(Math.max(0, max - doc.count)));
      res.set('RateLimit-Reset', String(resetSeconds));

      if (doc.count > max) {
        res.set('Retry-After', String(resetSeconds));
        return res.status(429).json({ message: 'Too many tracking requests. Please wait a moment and try again.' });
      }
      next();
    } catch (err) {
      // Never block tracking because the limiter itself failed
      console.error('Rate limiter error:', err.message);
      next();
    }
  };
};
