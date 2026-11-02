# Sprint 3.6 — Shared-school-IP student PIN login protection

## Problem and change

The former auth limit was 20 requests per IP per 15 minutes, and the app-wide general limit was 300 requests per IP per 15 minutes. A busy school computer lab shares a NAT address and could be locked out while many legitimate children were signing in.

Only the exact five-digit student PIN route (/api/auth/student/pin-login and its /api/v1 alias) now bypasses the unrelated 300-request general IP budget. Existing school/admin and teacher authentication limits remain unchanged.

The student PIN endpoint uses two independent failure-only counters:
- **80 unsuccessful requests per source IP per 15 minutes**, including malformed requests and rate-limited attempts.
- **5 unsuccessful requests per candidate PIN per 15 minutes**, keyed by the server's keyed HMAC PIN lookup, not by raw student PIN text.

A successful PIN login is removed from both counters when its HTTP response finishes. The general limiter still applies to other endpoints. Malformed PINs also consume the IP budget. The test suite exercises 25 successful logins from one source, per-PIN guessing, rotated IP-wide guessing, the alternate v1 API path and forged forwarding headers.

## Limits of the current implementation

The default express-rate-limit storage is **process-local memory**. It is **not shared between horizontally scaled Node workers or replicas**, and restarts reset its counters. **Before 10,000-student production release, provision a shared atomic Redis/equivalent rate-limit store across all instances** and validate the teacher/admin, global and PIN buckets, plus network-level WAF controls and alerts. Without that, a distributed attack can evade the per-process limits.

The library also counts requests in flight before their status is known. A very large simultaneous burst can temporarily trigger a 429 even when most credentials will eventually succeed; measure and tune controlled multi-workstation sign-in loads at the real school ingress. Repeated wrong PINs could delay one student; school staff need a safe audited recovery path and not an unauthenticated bypass.

Express currently does not trust arbitrary proxy-provided client-IP headers. When operating behind an approved reverse proxy, configure and verify an explicit trusted-proxy boundary before relying on IP quotas; never directly trust client-controlled X-Forwarded-For.

## Verification

From backend:

    pnpm install --frozen-lockfile
    pnpm run build
    pnpm exec jest --runInBand tests/integration/studentPinLabThrottle.test.ts

The tests use disposable MongoDB accounts, fake school identifiers and genuine bcrypt comparisons, not real school databases or student PINs. A green CI result is not proof of cross-replica security or real school load.

A supervised real-lab acceptance should sign in many authorized test students behind the school's NAT, measure p95, test wrong PIN behavior and verify proxy/rate-limiter aggregation. Do not record real PINs in logs or screenshots.

**Release status:** NO-GO for multi-instance school-wide rollout until shared-store rate limiting and real-device load testing pass.
