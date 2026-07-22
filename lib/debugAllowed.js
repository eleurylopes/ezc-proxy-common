// debugAllowed — time-boxed gate for DEBUG_ENABLED endpoints.
//
// AUDIT FIX #4 (P1): /v1/debug/token-claims (and any DEBUG endpoint) must
// be gated by BOTH DEBUG_ENABLED=true AND (if set) DEBUG_ENABLED_UNTIL being
// in the future. Prevents forgotten debug flags from staying live weeks
// after a debugging session ended.
//
// Callers should also console.warn on every invocation to catch abuse
// (not this function's job — do it at the route handler).
export function debugAllowed() {
  if (String(process.env.DEBUG_ENABLED || '').toLowerCase() !== 'true') {
    return { ok: false, reason: 'debug_disabled' };
  }
  const until = process.env.DEBUG_ENABLED_UNTIL;
  if (until) {
    const t = Date.parse(until);
    if (Number.isNaN(t)) return { ok: false, reason: 'debug_enabled_until_unparseable' };
    if (Date.now() > t) return { ok: false, reason: 'debug_window_expired' };
  }
  return { ok: true };
}
