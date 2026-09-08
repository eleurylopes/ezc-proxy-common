// Tests for htmlEscape — used before interpolating env-var / user-controlled
// strings into HTML responses (audit fix #5). An escaping regression is a
// stored/reflected XSS in the landing and status pages.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { htmlEscape } from '../index.js';

describe('htmlEscape', () => {
  test('escapes all five HTML-significant characters', () => {
    assert.equal(htmlEscape(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  });

  test('neutralises a script tag', () => {
    assert.equal(
      htmlEscape('<script>alert(1)</script>'),
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  test('neutralises an attribute-breakout payload', () => {
    assert.equal(
      htmlEscape(`" onerror="alert(1)`),
      '&quot; onerror=&quot;alert(1)',
    );
  });

  test('escapes ampersand first so entities are not double-decoded', () => {
    // If & were escaped last, '&lt;' would come back as '&lt;' decoding to '<'.
    assert.equal(htmlEscape('&lt;'), '&amp;lt;');
  });

  test('leaves safe text untouched', () => {
    assert.equal(htmlEscape('Phaenarete Distribuidora 123'), 'Phaenarete Distribuidora 123');
  });

  test('preserves non-ASCII (Portuguese accents must survive)', () => {
    assert.equal(htmlEscape('Autenticação necessária'), 'Autenticação necessária');
  });

  for (const [input, expected] of [[null, ''], [undefined, ''], ['', '']]) {
    test(`coerces ${String(input)} to empty string`, () => {
      assert.equal(htmlEscape(input), expected);
    });
  }

  test('coerces numbers and booleans without throwing', () => {
    assert.equal(htmlEscape(0), '0');
    assert.equal(htmlEscape(false), 'false');
  });

  test('is idempotent-safe (double-escaping is visible, not lossy)', () => {
    assert.equal(htmlEscape(htmlEscape('<b>')), '&amp;lt;b&amp;gt;');
  });
});
