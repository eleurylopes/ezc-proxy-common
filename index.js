// @ezc/proxy-common — canonical audit-fix implementations shared across
// EZC vendor proxies (ezc-onlyu-proxy, ezc-fyhub-proxy, ezc-gpag-proxy).
//
// Every function here traces back to a specific finding from the July 2026
// security audit (onlyu-proxy commit 7669e4c). Consumers should import from
// here rather than re-implement — the weekly-doc-drift-audit will flag any
// proxy that reimplements a function that exists in this module.

export { validateAmount } from './lib/validateAmount.js';
export { htmlEscape }     from './lib/htmlEscape.js';
export { debugAllowed }   from './lib/debugAllowed.js';
export { timingSafeAdmin } from './lib/timingSafeAdmin.js';
export { buildAgent }     from './lib/buildAgent.js';
export { mkWebhook }      from './lib/mkWebhook.js';
export { openJournal, journalWebhook } from './lib/journal.js';
