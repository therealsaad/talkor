# Class 1 · Level 1 — My First Day

**Canonical address:** `g01-l01` · **Textbook source:** English Balbharati Standard One (2025 first edition / 2026 reprint), Unit 1.1 *My First Day*, printed page 1.

This is the **ten-scene original First Day speaking adventure**, not the historical `am/an/at` starter. The student speaks with Miss Julie using the authenticated existing `/student/lesson/[id]` lesson engine. The saved old foundation activity IDs and progress remain in Mongo history, but do not replace or grant completion credit for the new syllabus.

## Actual teaching sequence

1. Hello at school.
2. Skip like a bunny.
3. Run in the playground.
4. Walk to school.
5. Make a big grin/smile.
6. Listen to the school bell.
7. Jump like a frog (optional finger movement).
8. Play with friends.
9. Go into the classroom.
10. Celebrate Grade One, revise school actions and assign short spoken homework.

On a first visit a reviewed **full 87–93-second** Class 1 introduction plays before the first activity, without an in-app skip. A browser can request fullscreen but cannot prevent Escape outside managed kiosk mode. Actual child-facing lesson assets, automatic waiting/feedback, Sarvam recognition, Qwen response, Azure speech and idempotent Mongo progress live in the **backend and student runtime**, not in `activities.ts`.

The original prompts and evidence criteria in `activities.ts` are **staff-only rehearsal metadata** with `approved:false`: they are not proof of a teacher-approved production release. `config.ts` keeps `studentPlayable:false` because *source metadata is not a publication switch*. The staff curriculum explorer reads **actual Level/Lesson/Activity statuses** from its authenticated backend API and displays a separate live publication indicator.

The original 1.1 textbook includes a listening/singing and a look-and-say exercise; real teacher review must check the full exercise, movement and vocabulary coverage rather than treating one short answer as mastering the whole chapter. Do not reproduce protected textbook artwork or recitations without permission.

## Publication and map

The first stone on `/student/levels` uses the Class 1 school map. Its name/status are derived from the logged-in student's real curriculum. Clicking CURRENT opens `/student/continue` so the backend supplies the first unfinished lesson/scene; later stones remain locked until the immediately previous lesson and level are completed and the next one is genuinely published. Staff can inspect the same canonical `g01-l01` address on `/school/curriculum-map`, including the current Mongo publication status.

**Class 1 Level 1 does not publish merely by merging this code.** To activate exactly the existing reviewed ten-scene v3, see `docs/class1-level1-publication-and-map.md` (repo root). Its default script is read-only, while the opt-in transactional `--apply` checks teacher/device approval, the ten ordered scene records, real HTTPS intro and ten S3 narration clips, legacy progress and no competing active lesson. Unpublished Level 2 never unlocks by implication.

Main safety checks: `backend/tests/unit/class1Level1Publication.test.ts`, `backend/tests/integration/class1PublishedLevel1Journey.test.ts`, the frontend Class 1 map/intro contracts, and the existing general 110-level progression and role security tests. Real school hardware acceptance remains mandatory.
