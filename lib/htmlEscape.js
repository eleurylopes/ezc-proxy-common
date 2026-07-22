// htmlEscape — sanitize env-var / user-controlled strings before HTML output.
//
// AUDIT FIX #5 (P2): Landing page interpolates env vars (OWNER_CONTACT_*,
// tenant name, base URLs) into HTML without escaping. Low risk since env
// vars are operator-controlled, but a stray "<" or "\"" breaks the page.
// Apply to EVERY env-var interpolation site in HTML output.
export function htmlEscape(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
