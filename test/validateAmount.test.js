// Tests for validateAmount — the money safety-ceiling check.
//
// This function gates every amount that reaches a vendor money API across
// ezc-gateway, ezc-monitor, ezc-fyhub-proxy, ezc-gpag-proxy and ezc-onlyu-proxy.
// A regression here is a money bug in five services at once, so the edge cases
// below (sub-cent precision, the ceiling boundary, non-numeric coercion) are the
// point of this file rather than incidental extras.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateAmount } from '../index.js';

describe('validateAmount — accepts valid money', () => {
  for (const [input, expected] of [
    [1, 1],
    [0.01, 0.01],
    [100, 100],
    [29_000, 29_000],
    [49_999.01, 49_999.01],
    ['12.34', 12.34],       // numeric strings are coerced
    ['  42  ', 42],         // ...including whitespace-padded
    ['1e3', 1000],          // ...and exponent notation
    [5_000_000, 5_000_000], // exactly at the default ceiling
  ]) {
    test(`accepts ${JSON.stringify(input)} -> ${expected}`, () => {
      const r = validateAmount(input);
      assert.equal(r.ok, true, `expected ok for ${JSON.stringify(input)}, got ${JSON.stringify(r)}`);
      assert.equal(r.amount, expected);
    });
  }

  test('does NOT silently round a 3-decimal amount up to 2dp', () => {
    // 1.999 must be REJECTED, not quietly turned into 2.00. Silently rounding a
    // payment amount would be a money bug; the caller has to send clean cents.
    const r = validateAmount(1.999);
    assert.equal(r.ok, false);
    assert.equal(r.error, 'amount_sub_cent_precision');
  });

  test('is immune to binary float drift (0.1 + 0.2)', () => {
    const r = validateAmount(0.1 + 0.2); // 0.30000000000000004
    assert.equal(r.ok, true);
    assert.equal(r.amount, 0.3);
  });
});

describe('validateAmount — rejects non-money', () => {
  for (const [input, error] of [
    [0, 'amount_must_be_positive'],
    [-1, 'amount_must_be_positive'],
    [-0.01, 'amount_must_be_positive'],
    [NaN, 'amount_not_finite'],
    [Infinity, 'amount_not_finite'],
    [-Infinity, 'amount_not_finite'],
    ['abc', 'amount_not_finite'],
    ['', 'amount_must_be_positive'],   // Number('') === 0
    [null, 'amount_must_be_positive'], // Number(null) === 0
    [undefined, 'amount_not_finite'],  // Number(undefined) === NaN
    [{}, 'amount_not_finite'],
  ]) {
    test(`rejects ${JSON.stringify(input) ?? String(input)} -> ${error}`, () => {
      const r = validateAmount(input);
      assert.equal(r.ok, false);
      assert.equal(r.error, error);
    });
  }

  test('rejects sub-cent precision', () => {
    const r = validateAmount(0.001);
    assert.equal(r.ok, false);
    assert.equal(r.error, 'amount_sub_cent_precision');
  });

  test('rejects a third decimal place (1.005)', () => {
    assert.equal(validateAmount(1.005).error, 'amount_sub_cent_precision');
  });
});

describe('validateAmount — safety ceiling', () => {
  test('rejects just above the default ceiling and reports it', () => {
    const r = validateAmount(5_000_000.01);
    assert.equal(r.ok, false);
    assert.equal(r.error, 'amount_exceeds_safety_ceiling');
    assert.equal(r.ceiling, 5_000_000);
  });

  test('ceiling is read from MAX_AMOUNT_BRL at call time, not module load', () => {
    // ezc-gateway/ezc-monitor previously cached this in a module-level const.
    // Reading per call is what lets those services drop their local copy, so
    // it is load-bearing behaviour and is asserted here.
    const prev = process.env.MAX_AMOUNT_BRL;
    try {
      process.env.MAX_AMOUNT_BRL = '100';
      const over = validateAmount(101);
      assert.equal(over.ok, false);
      assert.equal(over.error, 'amount_exceeds_safety_ceiling');
      assert.equal(over.ceiling, 100);
      assert.equal(validateAmount(100).ok, true, '100 should sit exactly on the ceiling');
    } finally {
      if (prev === undefined) delete process.env.MAX_AMOUNT_BRL;
      else process.env.MAX_AMOUNT_BRL = prev;
    }
  });

  test('default ceiling applies when MAX_AMOUNT_BRL is unset', () => {
    const prev = process.env.MAX_AMOUNT_BRL;
    delete process.env.MAX_AMOUNT_BRL;
    try {
      assert.equal(validateAmount(5_000_001).ceiling, 5_000_000);
    } finally {
      if (prev !== undefined) process.env.MAX_AMOUNT_BRL = prev;
    }
  });
});
