# @ezc/proxy-common

Shared audit-fix implementations for EZC vendor proxies. Prevents drift across `ezc-onlyu-proxy`, `ezc-fyhub-proxy`, `ezc-gpag-proxy` (and future proxies).

Every function here traces back to a specific finding from the July 2026 security audit (canonical implementation: `onlyu-proxy` commit `7669e4c`).

## Modules

| Module | Purpose | Audit fix |
|---|---|---|
| `validateAmount` | Amount ceiling check that handles nested `payment.amount` | #2 P0 |
| `htmlEscape` | HTML sanitization for env-var interpolation | #5 P2 |
| `debugAllowed` | Time-boxed DEBUG_ENABLED gate | #4 P1 |
| `timingSafeAdmin` | Timing-safe admin-token middleware | #1 P0 |
| `buildAgent` | mTLS Undici Agent constructor (documented `rejectUnauthorized: false`) | Accepted risk |
| `mkWebhook` | Webhook handler factory (origin verify + async journal) | #13 |
| `openJournal` / `journalWebhook` | Journal file with 0600 perms + async append | #3 P1 |

## Usage

Add as git dependency in your proxy's `package.json`:

```json
{
  "dependencies": {
    "@ezc/proxy-common": "git+https://github.com/eleurylopes/ezc-proxy-common.git#main"
  }
}
```

Then import what you need:

```js
import { validateAmount, htmlEscape, timingSafeAdmin, buildAgent } from '@ezc/proxy-common';

const requireAdmin = timingSafeAdmin(process.env.ADMIN_TOKEN);
app.get('/admin/thing', requireAdmin, handler);

const v = validateAmount(req.body.amount, req.body.payment?.amount);
if (!v.ok) return res.status(400).json(v);
```

## Drift detection

The `weekly-doc-drift-audit` scheduled task compares each proxy's `server.js` against this module and flags any local re-implementation of a function that exists here. If a proxy needs a variant of a shared function, add a new export here (with the audit reasoning documented) rather than fork.

## Node engine

Requires Node.js >= 20 (uses ESM + AbortSignal.timeout in some consumers).

## Versioning

`0.x` — API may change. Consumers pin to a commit SHA in package.json until 1.0 stabilizes the interface.
