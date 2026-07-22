// validateAmount — safety-ceiling check for money-moving requests.
//
// AUDIT FIX #2 (P0): The bypass. Callers can send either `amount: N` at the
// top level, OR `payment: { amount: N }` nested. Prior code only checked
// top-level. Consumers must pass BOTH candidates to this function and let it
// pick the effective one.
//
// Also enforces:
//   - positive, finite Number
//   - sub-cent precision rejected (avoid rounding surprises)
//   - hard MAX_AMOUNT_BRL ceiling (default 5,000,000; env override)
export function validateAmount(topLevel, nested) {
  const effective = nested ?? topLevel;
  const n = Number(effective);
  if (!Number.isFinite(n)) return { ok: false, error: 'amount_not_finite' };
  if (n <= 0)              return { ok: false, error: 'amount_must_be_positive' };
  const max = Number(process.env.MAX_AMOUNT_BRL || 5_000_000);
  if (n > max) return { ok: false, error: 'amount_exceeds_safety_ceiling', ceiling: max };
  const cents = Math.round(n * 100);
  if (Math.abs(n * 100 - cents) > 0.001) return { ok: false, error: 'amount_sub_cent_precision' };
  return { ok: true, amount: cents / 100 };
}
