#!/usr/bin/env node
/**
 * Talkora classroom readiness probe.
 * Read-only; never logs in, changes student progress, or spends cloud credits.
 * Usage: TALKORA_BACKEND_URL=http://127.0.0.1:5000 TALKORA_CLIENT_URL=http://127.0.0.1:3000 node scripts/classroom-readiness.mjs
 */
import assert from 'node:assert/strict';

const backend = process.env.TALKORA_BACKEND_URL || 'http://127.0.0.1:5000';
const client = process.env.TALKORA_CLIENT_URL || 'http://127.0.0.1:3000';
const timeoutMs = Number(process.env.TALKORA_PROBE_TIMEOUT_MS || 8000);
const results = [];

async function check(label, url, validate) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'cache-control': 'no-store' },
    });
    const body = (await response.text()).slice(0, 4096);
    assert.ok(validate(response, body), `unexpected HTTP ${response.status}`);
    results.push({ label, status: 'PASS', http: response.status });
  } catch (error) {
    results.push({ label, status: 'FAIL', error: error.message });
  }
}

await check('Frontend serves login entry', new URL('/', client), r => r.status === 200);
await check('Backend auth rejects anonymous identity', new URL('/api/auth/me', backend), r => [401, 403].includes(r.status));
await check('Student curriculum rejects anonymous access', new URL('/api/students/me/curriculum', backend), r => [401, 403].includes(r.status));
await check('Student progress rejects anonymous access', new URL('/api/students/me/progress', backend), r => [401, 403].includes(r.status));
await check('Next lesson rejects anonymous access', new URL('/api/students/me/next-lesson', backend), r => [401, 403].includes(r.status));

for (const r of results) console.log(`${r.status.padEnd(4)} ${r.label}: ${r.http ?? r.error}`);
console.log('\nScope: read-only connectivity and anonymous-access checks ONLY.');
console.log('NOT VERIFIED: student PIN, microphone/STT, AI, Azure/S3, progress writes, resume, homework, logout, classroom load.');
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
