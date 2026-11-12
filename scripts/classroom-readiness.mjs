#!/usr/bin/env node
/**
 * Read-only Talkora classroom connectivity and anonymous-access probe.
 * Does NOT certify a real student journey.
 */
import assert from 'node:assert/strict';

const backend = process.env.TALKORA_BACKEND_URL || 'http://127.0.0.1:5000';
const client = process.env.TALKORA_CLIENT_URL || 'http://127.0.0.1:3000';
const timeoutMs = Number(process.env.TALKORA_PROBE_TIMEOUT_MS || 8000);
assert.ok(Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000, 'invalid probe timeout');
for (const base of [backend, client]) {
  const url = new URL(base);
  assert.ok(['http:', 'https:'].includes(url.protocol), 'HTTP(S) endpoint required');
  assert.ok(!url.username && !url.password, 'credentials in endpoint URL forbidden');
}
const results = [];
async function check(label, url, validate) {
  try {
    const response = await fetch(url, {
      method: 'GET', redirect: 'manual',
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
await check('Frontend root serves HTML', new URL('/', client),
  (r, body) => r.status === 200 && /<html[\s>]/i.test(body));
await check('Backend health responds', new URL('/health', backend),
  (r, body) => {
    if (r.status !== 200) return false;
    try {
      const json = JSON.parse(body);
      return json.status === 'ok' && json.service === 'talkora-backend';
    } catch { return false; }
  });
for (const [label, path] of [
  ['Auth identity denies anonymous access', '/api/auth/me'],
  ['Student curriculum denies anonymous access', '/api/students/me/curriculum'],
  ['Student progress denies anonymous access', '/api/students/me/progress'],
  ['Next lesson denies anonymous access', '/api/students/me/next-lesson'],
]) {
  await check(label, new URL(path, backend), r => [401, 403].includes(r.status));
}
for (const result of results) console.log(`${result.status.padEnd(4)} ${result.label}: ${result.http ?? result.error}`);
console.log('\nRead-only probe. A 404 is a failure: missing routes are NOT proof of authorization.');
console.log('NOT VERIFIED: PIN, microphone/STT, AI, Azure/S3, Mongo writes, resume, homework, logout, classroom load.');
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
