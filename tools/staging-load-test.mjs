/** Controlled staging-only load smoke test. Does not simulate independent student sessions.
 * Usage: TALKORA_LOAD_TEST_TARGET=http://localhost:5000/api/health TALKORA_LOAD_TEST_ACK=STAGING node tools/staging-load-test.mjs
 * Optional: TALKORA_LOAD_TEST_CONCURRENCY=20 TALKORA_LOAD_TEST_REQUESTS=1000 TALKORA_LOAD_TEST_TOKEN=...
 */
import { performance } from 'node:perf_hooks'

const target = process.env.TALKORA_LOAD_TEST_TARGET || ''
if (process.env.TALKORA_LOAD_TEST_ACK !== 'STAGING') {
  console.error('Refusing load test. Set TALKORA_LOAD_TEST_ACK=STAGING explicitly and use authorized staging only.')
  process.exit(2)
}
let url
try { url = new URL(target) } catch { console.error('Provide a valid TALKORA_LOAD_TEST_TARGET'); process.exit(2) }
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) process.exit(2)
const concurrency = Number(process.env.TALKORA_LOAD_TEST_CONCURRENCY || 15)
const total = Number(process.env.TALKORA_LOAD_TEST_REQUESTS || 300)
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 150 || !Number.isInteger(total) || total < 1 || total > 10000) {
  console.error('Concurrency must be 1–150 and requests 1–10000'); process.exit(2)
}
const token = process.env.TALKORA_LOAD_TEST_TOKEN
const latencies = []
const codes = new Map()
let index = 0; let errors = 0
const launchedAt = performance.now()
async function worker() {
  while (true) {
    const task = index++
    if (task >= total) return
    const started = performance.now()
    try {
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(10000), cache: 'no-store' })
      codes.set(response.status, (codes.get(response.status) || 0) + 1)
      if (!response.ok) errors++
      await response.arrayBuffer()
    } catch (error) {
      errors++
      codes.set('network-error', (codes.get('network-error') || 0) + 1)
    } finally { latencies.push(performance.now() - started) }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))
latencies.sort((a,b)=>a-b)
const percentile = (p) => Number((latencies[Math.min(latencies.length-1, Math.ceil(latencies.length*p)-1)]||0).toFixed(1))
console.log(JSON.stringify({ url: `${url.origin}${url.pathname}`, concurrency, requests: total, failures: errors,
  failureRate: `${(100*errors/total).toFixed(2)}%`, seconds: Number(((performance.now()-launchedAt)/1000).toFixed(2)),
  p50ms: percentile(.5), p95ms: percentile(.95), p99ms: percentile(.99), codes: Object.fromEntries(codes) },null,2))
if (errors) process.exitCode = 1
