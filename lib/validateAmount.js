// validateAmount — safety-ceiling check for money-moving requests.
//
// AUDIT FIX #2 (P0): The bypass. Callers must resolve nested amount BEFORE
// calling this function. Idiomatic pattern at consumer call site:
//   const effective = req.body.payment?.amount ?? req.body.amount;
//   const v = validateAmount(effective);
//
// This function then handles:
//   - positive, finite Number
//   - sub-cent precision rejected (avoid rounding surprises)
//   - hard MAX_AMOUNT_BRL ceiling (default 5,000,000; env override)
export function validateAmount(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return { ok: false, error: 'amount_not_finite' };
  if (n <= 0)              return { ok: false, error: 'amount_must_be_positive' };
  const max = Number(process.env.MAX_AMOUNT_BRL || 5_000_000);
  if (n > max) return { ok: false, error: 'amount_exceeds_safety_ceiling', ceiling: max };
  const cents = Math.round(n * 100);
  if (Math.abs(n * 100 - cents) > 0.001) return { ok: false, error: 'amount_sub_cent_precision' };
  return { ok: true, amount: cents / 100 };
}
