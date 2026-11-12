# Sprint 3.7 — Atomic shared MongoDB rate limiting across backend replicas

## Why and deployment contract

Talkora uses MongoDB for its persisted student and lesson state. The Sprint 3.6 school-lab PIN limits were still process-local with the default express-rate-limit memory store: two backend replicas gave an attacker two different quotas. Separately, the general 300-request/15-minute limiter used one school IP, which would lock out independent authenticated students using normal curriculum/progress APIs.

This sprint introduces the **MongoDB-backed atomic fixed-window store** in backend/src/middleware/mongo-rate-limit-store.ts without a new Redis dependency. All **production** limiters are backed by the same MongoDB deployment automatically; non-production defaults to memory, but can run the exact shared storage with TALKORA_SHARED_RATE_LIMITS=true.

### Storage and safe startup

- Atomic MongoDB findOneAndUpdate with a server-clock expiry test and window reset on every hit. Concurrent requests from different Node processes cannot lose increments. The TTL index on expiresAt only cleans up old documents, not the source of expiration logic.
- Namespace-separated counters: general, student-pin-ip, student-pin-guess, auth, ai, voice-session, voice-media and kg-lesson. Keys are HMAC-SHA256 values and never raw PIN/IP/student identifiers. Do not rotate JWT_SECRET or RATE_LIMIT_KEY_SECRET casually because all replicas must derive identical keys.
- Production starts serving HTTP **only after** MongoDB connects and the TTL collection/index is ready. If it fails, startup fails. Request-time MongoDB errors propagate through the existing error handler and are not treated as success.
- General API limiter now uses signed, unexpired student JWT identity (validated server-side even before auth middleware), scoped by student+school. Missing, forged or expired tokens continue to use the source-IP bucket. The KG and voice routes still use their authenticated per-student dedicated rate limiters.
- The existing 80 failures/IP and 5 failures/PIN-candidate per 15 minutes remain, and skipSuccessfulRequests still uncounts successful PIN logins. Teacher/admin limits remain.

### Hard requirements for production

1. All API replicas **must** connect to the same MongoDB cluster/database and use the same stable JWT and optional dedicated RATE_LIMIT_KEY_SECRET. Monitor Mongo operation timings, lock contention, collection size, TTL/index health and 429/5xx counts.
2. MongoDB becomes a critical availability dependency for every rate-limited API request. Design redundancy, connection pooling, network timeouts and load-shedding. Never silently fall back to process memory if it is unavailable.
3. Source-IP throttles assume the reverse proxy passes the actual originating client address through a **verified trusted proxy**. Express currently trusts no arbitrary X-Forwarded-For header. Behind a trusted ingress, explicitly configure and regression-test the correct trust chain, including proxy address spoofing, before relying on IP-based abuse limits.
4. RATE_LIMIT_KEY_SECRET, if provided, must be identical across replicas. Rotate with a documented maintenance window because previous counters become invisible to new keys.
5. Mongo-backed shared quotas solve counter consistency but **do not prove capacity for 10,000 students**. Test a normal school-day login burst (100+ device sessions) against the deployed ingress with synthetic, authorized accounts, then step up to the expected concurrent request and TTS/STT load. Confirm p50/p95/maximum latency and network errors; throttle counts alone do not prove throughput.
6. No child audio, raw student PIN, transcript or bearer token should enter database limiter keys or load-test logs. Test/staging must be isolated from real school data.

### CI verification

From backend, on disposable MongoDB:

    pnpm install --frozen-lockfile
    pnpm run build
    TALKORA_SHARED_RATE_LIMITS=true pnpm exec jest --runInBand tests/integration/mongoRateLimits.test.ts

On Windows PowerShell:

    $env:TALKORA_SHARED_RATE_LIMITS='true'; pnpm exec jest --runInBand tests/integration/mongoRateLimits.test.ts

The integration test runs two independently configured Express rate-limit middleware instances with the same Mongo namespace. It exercises 40 concurrent atomic hits, expiry/reset, failure-only successful-login uncounting, signed per-student general quota isolation and shared cross-node 429s. A separate pre-existing suite verifies the entire KG PIN-to-homework flow and PIN attack bounds. All test fixtures are disposable.

### Real rollout gate

A CI pass does **not** mean that the deployed load balancer, MongoDB, physical microphone/speakers, browser kiosk, or real student experience was exercised. Before rollout, stage two or more real backend replicas, verify successful login and correct 429 across nodes, disconnect Mongo temporarily to confirm there is no memory bypass, and run supervised concurrent synthetic student sessions at school-grade loads.

**Production scale status:** provisionally code-complete for shared counters, but 10,000-student release is NO-GO without staging/ingress load testing and observed Mongo capacity.
