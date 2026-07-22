// mkWebhook — factory for webhook receiver routes.
//
// AUDIT FIX #13 (dead code): Removes duplicated per-endpoint webhook
// handler code across vendor proxies. Produces a single handler that
// journals + optionally verifies origin IP + calls an optional verify hook.
//
// AUDIT FIX #1 (P0): Origin-IP check uses req.ip (Express with
// `trust proxy = 1`), NOT raw X-Forwarded-For. Mismatch → 403 with
// generic body, does NOT journal the rejected request.
import { journalWebhook } from './journal.js';

export function mkWebhook({ source, verifyKind, requireTrustedOrigin, trustedIps, journalPath, onVerify }) {
  return async function handler(req, res) {
    if (requireTrustedOrigin) {
      if (!trustedIps || !trustedIps.has(req.ip)) {
        console.warn(`[webhook:${source}] REJECTED origin=${req.ip} (not in trusted set)`);
        return res.status(403).json({ error: 'forbidden' });
      }
    }
    journalWebhook(journalPath, source, req);
    res.status(200).json({ received: true });
    // Optional post-ack verification (fire-and-forget)
    if (verifyKind && onVerify) {
      Promise.resolve().then(() => onVerify(req, verifyKind)).catch(e =>
        console.warn(`[webhook:${source}] verify failed: ${e.message}`));
    }
  };
}
