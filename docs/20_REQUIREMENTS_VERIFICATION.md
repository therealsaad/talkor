# Talkora 20-Requirement Verification — Evidence Boundaries

Source base: user-uploaded `talkor-main.zip`, NOT an imagined reconstructed app. KG enhancements selectively merged from the latest October 19 Azure/Groq/animation ZIP. Date: 2026-10-19.

**Do not confuse successful file-generation tests with production certification.** The new 110-workspace design and its staff-only map are structurally verifiable; the rest require additional implementation or live tests.

| # | Minimum requirement | Status | Exact remaining gap / evidence |
|---|---|---|---|
| 1 | 110 grade-specific levels | **STRUCTURE VERIFIED** | All 110 typed folders plus catalog and distinct visual designs. Unfinished activities and syllabus sign-off remain. |
| 2 | 10,000 student capacity | **UNVERIFIED** | Existing scalable boundaries and load tools; no 10K dataset or realistic concurrency test. |
| 3 | Miss Julie animations | **PARTIAL** | Seven real alpha WebM poses included; lip-sync and device QA pending. |
| 4 | Compulsory fullscreen KG1 intro | **PARTIAL** | Intro video + existing ticket gate. Kiosk policy and live playback tests needed; browsers cannot force F11. |
| 5 | Voice-first interaction | **PARTIAL** | KG code uses TTS/STT and touch; drafts in 109 other levels are not playable. |
| 6 | Smart bilingual AI corrections | **PARTIAL** | Groq guided feedback + Azure live voice integration carried forward; no credentialed end-to-end test. |
| 7 | Invisible adaptive difficulty | **PARTIAL** | Existing recommendation/memory/progress services; not connected to 109 unfinished lessons. |
| 8 | Automatic resume | **PARTIAL** | Existing student progress and secure lesson loader; 110 unbuilt lesson bodies not tested. |
| 9 | Animated games and class-specific activities | **PARTIAL** | KG board/touch and Class 4 preserved; remaining drafts have ideas, not playable activities. |
| 10 | AI/S3 audio caching | **PARTIAL** | S3/local tooling preserved and live uncached Azure prompts present; live test pending. |
| 11 | Secure five-digit PIN | **PARTIAL** | Existing PIN system and tab sessions preserved; penetration and collision audits pending. |
| 12 | Teacher dashboard | **PARTIAL** | Original dashboards/report code retained; full regression + live DB validation pending. |
| 13 | Principal/Admin dashboard | **PARTIAL** | Original code retained; live multi-school privacy checks pending. |
| 14 | Parent-facing reports | **PARTIAL** | Existing printable school-staff progress reports; live validation pending. |
| 15 | Scheduled PDF reports | **INCOMPLETE** | CSV export and PDF tools exist; automated delivery, live renderer verification missing. |
| 16 | Spoken homework | **PARTIAL** | KG Level 1 homework voice exists; not authored across 110. |
| 17 | Performance optimizations | **PARTIAL** | Separate music, compact WebMs, audio cache, indexed levels; no real performance benchmarks. |
| 18 | Production security | **UNVERIFIED** | Role-protected studio and existing auth; audit of every student endpoint incomplete. |
| 19 | Scalable architecture | **UNVERIFIED** | Modular Next/Node/Mongo/S3, no measured concurrent-capacity certification. |
| 20 | Original UI and Class 4 preserved | **SOURCE VERIFIED** | Existing student and Class 4 files are retained; production browser regression pending. |

### Acceptance gates to earn 20/20

- **Curriculum:** subject teacher approves objectives, creates working activities, audio, rubrics, replay, homework and assets for all 110. All activity IDs must be unique and linked to MongoDB lessons. Unpublished drafts must stay hidden from students.
- **Video:** test exactly once per KG1 visit, real 60–90s play-through, fullscreen exit/re-entry, no in-app skip. Lockdown requires administrator-installed kiosk browser.
- **Voice / Groq:** test microphone denial, silence, wrong answer, child accent, latency timeout, invalid token, Azure outages, Groq outage, dynamic voice uncached, no student data accidentally retained.
- **Security:** school scoped CRUD, auth/role checks on every API, scoped download permission, five-digit PIN brute-force rate limits, secrets scanning, JWT revocation, lab auto-logout and timeout, audit logs.
- **Reporting:** production-grade PDF rendering and scheduled daily/weekly/monthly delivery with opt-in/privacy/access controls.
- **Scalability:** 10K seeded accounts with consent-safe test data, concurrency/load profiles reflecting actual labs, p95/99 audio latencies, S3 cost/egress, DB indexing, queue backpressure and recovery.
- **Quality:** clean frontend/backend production builds, unit+integration tests, Chrome/Edge Android playback on real lab devices, Class 4 and admin regression tests.

### Delivered and inspected

- `client/features/lessons/grades/{kg,class-01...class-10}/level-01...10` (110 x 7 editable files).
- `client/features/lessons/registry.ts`: one literally keyed lazy import per level; staff-only preview at `/school/curriculum-studio/:grade/:level`.
- `backend/src/curriculum/level-design-manifest.json` with 110 entries; existing `roadmap.ts` and Mongo mapping stay canonical for student publishing.
- `tools/verify-110-levels.cjs` runnable offline; `docs/110_LEVEL_TEAM_ARCHITECTURE.md` team conventions and deployment gates.
- October 19 KG enhancements (Azure live voice, Groq corrections, staff mic preview, seven transparent animations, separate soundtrack, garden map); these were source-merged, not independently verified against live credentials here.

### Release classification

**Team development / staging. NOT 20/20 production-verified.** This distinction is mandatory for an honest handoff.
