# Talkora Class 1 — AI curriculum bridge contract (DRAFT, not a runtime API)

**Review state:** PROPOSED ONLY — needs Codex and human-teacher sign-off.  
**App source of truth:** `therealsaad/talkor` (school selection, authorization, evidence and `ProgressService`).  
**Advisory service:** `therealsaad/talkora-ai-private` (Codex's isolated `teaching.py` and development-only harness).

This specification reconciles the two 2025–26 official Std 1 English books with the eight-part `TeachingRequest.scope` in AI PR #16. It does **not** approve lesson sequencing, publish lessons, create MongoDB IDs, or enable any student HTTP route.

## 1. Source-to-scope identity mapping

| AI scope field | Trusted source | Rule |
|---|---|---|
| `namespace` | Internal versioned registry | Proposed `talkora.mh.english.g01`; never a client-selected entitlement |
| `bookId` | `entry.textbookId`, matching `dataset.textbookTrack.textbookId` | Exact enum: `ENGLISH_BALBHARATI_G01` or `MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM` |
| `edition` | `entry.textbookEdition.academicYearOfFirstUse` | `2025-26` for these records; a future edition is distinct even if chapter codes repeat |
| `trackId` | `dataset.textbookTrack.trackType` | Exact `ENGLISH_MEDIUM` / `NON_ENGLISH_MEDIUM`; **school-admin-authorized**, never inferred from Hindi/Marathi speech |
| `lessonId` | Existing Node authorized lesson identity | Resolve through the existing CurriculumClass → Level → Lesson hierarchy. The shared `g01-lNN` is a **level** ID, not proof of a particular lesson. Do not fabricate a lesson ID from the chapter title. |
| `activityId` | Existing Node authorized activity identity | Use the server-resolved canonical activity; do not trust values submitted by the student browser |
| `objectiveId` | Future teacher-reviewed stable objective registry | Required unique ID; absent from draft `learningObjectives: string[]`. **BLOCK** real integration until created and reviewed. Never use an array index as a permanent learning-objective ID. |
| `version` | Immutable reviewed curriculum-objective revision | **BLOCK** real integration until an approved revision exists; a draft `schemaVersion` alone is not the content version. Track content changes and prevent stale sessions from crossing revisions. |

The existing research `curriculumId` (e.g. `bal-g01-u1-c1.01`, `meb-g01-u1-c1.01`) remains a **source entry key**, not a `lessonId`. A server-owned mapping `curriculumId → objectiveIds → authorized activities` must be reviewed before activation.

## 2. Track identity examples — NOT student requests

```json
{
  "englishMedium": {
    "namespace": "talkora.mh.english.g01",
    "bookId": "ENGLISH_BALBHARATI_G01",
    "edition": "2025-26",
    "trackId": "ENGLISH_MEDIUM",
    "sourceCurriculumId": "bal-g01-u1-c1.01"
  },
  "nonEnglishMedium": {
    "namespace": "talkora.mh.english.g01",
    "bookId": "MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM",
    "edition": "2025-26",
    "trackId": "NON_ENGLISH_MEDIUM",
    "sourceCurriculumId": "meb-g01-u1-c1.01"
  }
}
```

These illustrative records intentionally omit lesson/activity/objective/revision IDs because the Node-backed, teacher-approved identities have not been established. **Neither example can be passed to a production teaching service as an authorized scope.**

## 3. Pre-request authorization gate

Node must verify, in this order:

1. Valid authenticated student session from the existing five-digit PIN flow, with no reuse of another child's session on shared computers.
2. Current school’s explicitly configured **textbook track** and the student's grade/class; no language-to-school-medium inference.
3. `bookId`, edition, `curriculumId`, level, lesson, activity and stable objective are from the **same** authorized track and content revision.
4. Source edition verified *and* pedagogy reviewed by an actual teacher. `syllabusVerification=OFFICIAL_PDF_VERIFIED` does not imply approved pedagogy; `DRAFT_PENDING_TEACHER_REVIEW` is blocked.
5. Intro-video, voice playback acknowledgements, activity status, answer/hint provenance and existing Node progression gates remain satisfied.
6. No unlicensed poem/audio/artwork; every referenced visual/audio asset is actually available and authorized.

Only the server creates the eight-part scope and any advisory turn event. The browser must not supply an authorization grant for Qwen.

## 4. Response handling and evidence boundaries

Codex's development harness returns `teaching.dev.v1` only in a separate opt-in test service. It is **not** an approved production contract. Responses from this service must remain advisory:

- `validatedLearning: false`, `acceptedEvidence: []`, `activityComplete: false`; never infer success from `lexicalObservation` or `responseQuality`.
- Miss Julie may explain, guide, correct and propose independent questions, but Node chooses and scores authorized checks, mastery dimensions, revision scheduling and unlocks.
- A teacher-provided answer/hint **contaminates** that attempt as evidence of independence. Silence, STT failure, unavailable microphone or wrong textbook edition cannot become success.
- Support language (`en`, `hi`, `mr`) is independent of school textbook track. Code-switching is permitted but must not change track.
- Idempotency and durable revision state belong to Node/MongoDB; the test harness's in-memory revision lock is not a production substitute.

## 5. Release-blocking contract tests

Before any runtime adapter is enabled, automate cases for:

1. `bal-g01-u1-c1.01` and `meb-g01-u1-c1.01` do not collide; `1.10` and `1.11` cannot truncate into `1.1`.
2. Switching schools or book tracks rejects stale sessions, old revisions, mismatched edition and mixed-book objectives.
3. Node refuses draft pedagogy, fake reviewer stamps, unknown objective IDs, missing assets and unlicensed passages.
4. An assisted echo, model-proposed success, duplicated submission or failed Azure speech/playback ACK never advances progress.
5. An already completed `g01-l01` English-medium lesson remains intact when adding the new track; never retroactively reinterpret saved progress.
6. Approved material is delivered in teacher-reviewed chronological order, rather than a mere chapter-to-level feeder map.
7. No raw child transcript, names, PIN, token or unrelated history reaches Qwen; do not persist real names for vocabulary roleplay.

## 6. Next decisions

**Z.ai:** Produce stable teacher-reviewed objective identities, ordered chapter/prerequisite sequencing and signed bilingual examples for both books.  
**Codex:** Validate the exact adapter in the isolated harness using synthetic keys first; no live HTTP integration or curriculum lookup from client fields.  
**Project Manager / school pedagogy reviewer:** Approve book IDs, immutable revision policy, chronology and qualified teacher sign-off, then authorize a separate Node integration PR.

**Until then:** Both Unit One datasets and the AI bridge remain research/development artifacts, not lessons served to children.
