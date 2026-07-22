// timingSafeAdmin — timing-safe comparison for x-admin-token header.
//
// AUDIT FIX #1 (P0): The `===` string comparison on admin token was
// vulnerable to timing attacks (measurable difference in comparison time
// leaks byte-by-byte matches). Fix uses crypto.timingSafeEqual on
// equal-length buffers.
//
// Usage: `app.use(timingSafeAdmin(process.env.ADMIN_TOKEN))` on protected
// routes, or wrap individually as `app.get('/x', timingSafeAdmin(TOKEN), h)`.
import crypto from 'node:crypto';

export function timingSafeAdmin(expectedToken) {
  if (!expectedToken) {
    return (_req, res) => res.status(503).json({ error: 'admin_not_configured' });
  }
  const expectedBuf = Buffer.from(expectedToken, 'utf8');
  return function requireAdmin(req, res, next) {
    const provided = String(req.headers['x-admin-token'] || '');
    const providedBuf = Buffer.from(provided, 'utf8');
    if (providedBuf.length !== expectedBuf.length) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  };
}
