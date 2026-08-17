// @ezc/proxy-common — shared audit-fix implementations for the EZC vendor proxies.
//
// Only the three functions below are still shared. `mkWebhook`, `buildAgent` and
// the journal helpers were ALSO here, but each proxy evolved its own copy after
// the 2026-07/08 incidents (record-don't-reject webhooks, CF-Connecting-IP origin
// resolution, per-service journal paths). The versions in this module drifted and
// were never updated — in particular the old `mkWebhook` here still hard-rejected
// on `req.ip`, the exact behaviour the proxies deliberately abandoned. To stop
// anyone re-importing a regressed implementation, those exports were REMOVED
// (2026-08-17, audit dead-code finding). The per-proxy copies are canonical; the
// lib/ files remain only for historical reference and are not exported.

export { validateAmount } from './lib/validateAmount.js';
export { htmlEscape }     from './lib/htmlEscape.js';
export { debugAllowed }   from './lib/debugAllowed.js';
