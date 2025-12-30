// معدل محدودية بسيط بالذاكرة (بديل express-rate-limit)
const windowMs = 15 * 60 * 1000; // 15 دقيقة
const maxRequests = 300;
const hits = new Map();

export default function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const bucket = hits.get(ip) || { count: 0, start: now };

  if (now - bucket.start > windowMs) {
    bucket.count = 1;
    bucket.start = now;
  } else {
    bucket.count += 1;
  }

  hits.set(ip, bucket);

  if (bucket.count > maxRequests) {
    return res.status(429).json({ message: 'Too many requests, try again later.' });
  }
  return next();
}
