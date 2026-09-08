// Tests for debugAllowed — the time-boxed gate on DEBUG endpoints (audit fix #4).
// These endpoints expose token claims, so the gate must fail CLOSED: anything
// other than an explicit, unexpired opt-in has to return not-ok.
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { debugAllowed } from '../index.js';

const KEYS = ['DEBUG_ENABLED', 'DEBUG_ENABLED_UNTIL'];
let saved;
beforeEach(() => { saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]])); KEYS.forEach(k => delete process.env[k]); });
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

const inFuture = () => new Date(Date.now() + 3600_000).toISOString();
const inPast   = () => new Date(Date.now() - 3600_000).toISOString();

describe('debugAllowed — fails closed', () => {
  test('denies when DEBUG_ENABLED is unset', () => {
    assert.deepEqual(debugAllowed(), { ok: false, reason: 'debug_disabled' });
  });

  for (const v of ['false', '0', 'yes', 'on', '1', 'TRUE ', '']) {
    test(`denies DEBUG_ENABLED=${JSON.stringify(v)} (only exact "true" opts in)`, () => {
      process.env.DEBUG_ENABLED = v;
      assert.equal(debugAllowed().ok, false);
    });
  }

  test('denies once the window has expired', () => {
    process.env.DEBUG_ENABLED = 'true';
    process.env.DEBUG_ENABLED_UNTIL = inPast();
    assert.deepEqual(debugAllowed(), { ok: false, reason: 'debug_window_expired' });
  });

  test('denies when the expiry is unparseable rather than treating it as absent', () => {
    process.env.DEBUG_ENABLED = 'true';
    process.env.DEBUG_ENABLED_UNTIL = 'not-a-date';
    assert.deepEqual(debugAllowed(), { ok: false, reason: 'debug_enabled_until_unparseable' });
  });
});

describe('debugAllowed — allows only an explicit, live opt-in', () => {
  test('allows DEBUG_ENABLED=true with no expiry set', () => {
    process.env.DEBUG_ENABLED = 'true';
    assert.deepEqual(debugAllowed(), { ok: true });
  });

  test('allows within an unexpired window', () => {
    process.env.DEBUG_ENABLED = 'true';
    process.env.DEBUG_ENABLED_UNTIL = inFuture();
    assert.deepEqual(debugAllowed(), { ok: true });
  });

  test('is case-insensitive on the flag value', () => {
    process.env.DEBUG_ENABLED = 'TRUE';
    assert.equal(debugAllowed().ok, true);
  });
});
