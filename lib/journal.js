// journal — webhook journal file with 0600 perms + async append.
//
// AUDIT FIX #3 (P1): `fs.appendFileSync` blocked the event loop on every
// webhook, and the journal file inherited default 0644 perms (LGPD footgun
// on any host with local shell access — journal contains full webhook
// bodies with CPFs, amounts, endToEndIds).
//
// Fix: async append + boot-time 0600 enforcement.
import fs from 'node:fs';
import path from 'node:path';

export function openJournal(journalPath) {
  try {
    const dir = path.dirname(journalPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(journalPath)) {
      const st = fs.statSync(journalPath);
      const mode = st.mode & 0o777;
      if (mode !== 0o600) {
        console.warn(`[ezc-common] journal file had perms 0${mode.toString(8)}, tightening to 0600`);
        fs.chmodSync(journalPath, 0o600);
      }
    } else {
      fs.closeSync(fs.openSync(journalPath, 'a', 0o600));
    }
  } catch (e) {
    console.warn('[ezc-common] journal init:', e.message);
  }
}

export function journalWebhook(journalPath, source, req) {
  const entry = {
    at: new Date().toISOString(),
    source,
    ip: req.ip,
    method: req.method,
    path: req.path,
    body: req.body,
  };
  fs.appendFile(journalPath, JSON.stringify(entry) + '\n', err => {
    if (err) console.warn('[ezc-common] journal append failed:', err.message);
  });
}
