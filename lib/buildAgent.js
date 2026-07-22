// buildAgent — construct an Undici Agent with mTLS + accepted-risk config.
//
// AUDIT NOTE: `rejectUnauthorized: false` is the accepted decision across
// vendor proxies. All four vendors (OnlyU/Onz, Fyhub/Kikai, Grab & Go/Dock,
// Cartos) serve leaf certs from private CAs and do not ship intermediate
// chains — the vendors' own documented integration pattern is to disable
// server cert verification client-side. See each proxy's SECURITY.md for
// per-vendor justification.
//
// Consumers still verify identity via THEIR OWN mTLS client cert.
import fs from 'node:fs';
import { Agent } from 'undici';

export function buildAgent(realm) {
  const cert = readIfExists(realm.certPath);
  const key = readIfExists(realm.keyPath);
  if (!cert || !key) {
    console.warn(`[ezc-common] ${realm.name} mTLS NOT ready (cert=${!!cert} key=${!!key} paths: ${realm.certPath}, ${realm.keyPath})`);
    return null;
  }
  return new Agent({ connect: { cert, key, rejectUnauthorized: false } });
}

function readIfExists(p) { try { return fs.readFileSync(p); } catch { return null; } }
