# Class 1 Level 1 — publication and ten-stone map

## Current rollout state

The **code** for the voice-first, ten-scene *My First Day* v3 student journey is staged. The old `am/an/at` foundation lesson may still be present as a historical draft. The curriculum explorer's source catalog is a teaching plan, **not** a publishing API or a record of actual active student content.

**No database is published by merging the PR.** This is a deliberately guarded deployment migration for the *existing* approved `g01-l01` student lesson after the school operator verifies real assets, audio and hardware. A local MP4 or a green CI test does not substitute for human approval.

The real student path is:

`five-digit PIN -> /student/continue -> Class 1 Level 1 first unfinished activity -> required full intro on a first visit -> Miss Julie speaks -> student answers -> Sarvam + Qwen -> Azure feedback ends -> server records English evidence -> next scene -> spoken homework -> saved progress -> /student/continue`

For a Class 1 student, `/student/levels` displays ten fixed stones over the existing Class 1 map image. Titles, status and links are taken from the authenticated student's server curriculum. The first/current stone routes through the authoritative next-lesson resolver; later stones stay locked unless their content is genuinely published and the immediately previous level is completed. Completed stones support separately authorized replay. The staff curriculum explorer reads publication from Mongo, not the draft config.

## 1. Deploy the code and test first

Merge [PR #106](https://github.com/therealsaad/talkor/pull/106) **only after CI passes**. Deploy the updated frontend and backend together. Run the disposable integration tests against an isolated MongoDB test database (never production):

```powershell
cd D:\talkor\talkor\backend
pnpm build
pnpm exec jest --runInBand tests/unit/class1Level1Publication.test.ts
pnpm exec jest --runInBand tests/integration/class1PublishedLevel1Journey.test.ts
```

The integration test pre-creates a published First Day lesson in disposable Mongo and verifies a Class 1 token's curriculum, next lesson, exact ten scenes, persisted cursor and unpublished Level 2 lock, plus staff read-only status. It does **not** write into the school's production database or prove physical microphone/speaker operation.

## 2. Read-only actual-database preflight

From the backend folder *with the exact intended database environment selected*:

```powershell
pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts
```

Check that `g01-l01` is the protected ten-scene v3 draft and that `blockers` is empty. A first-day v4 poem revision or an old two-letter-word v2 draft is **not** silently accepted as this release. The release must have exactly ten ordered original activities, correct immutable Priya/S3 keys, no competing active lesson and **no already-completed legacy Level 1 progress**. A saved completed legacy level requires explicit, individually reviewed migration; this script must refuse to erase mastery.

## 3. Actual review prerequisites

Before enabling publication, an authorized educator/operator must verify:

- The First Day intro URL already saved with the v3 lesson is an actually reviewed HTTPS video of 87–93 seconds with audible narration and no in-app skip. `client/public/lessons/class-01/level-01/miss-julie-first-day-intro.mp4` existing in GitHub alone is not approval.
- All ten original English narration clips are present under immutable `class-01/level-01/v3/*-en.wav` S3 keys, with the expected spoken words and teacher-approved voices/visuals. The publishing script checks remote HEAD status, media type and size; a human must also *listen*.
- Sarvam speech recognition, the actual Qwen advice path, and Azure English/Hindi/Marathi replies perform correctly on the existing authenticated student flow. Help/silence and incorrect speech must not count as a completed English attempt.
- On the intended school device a real microphone and speaker play the correct entire teacher response; student progress remains saved and first unfinished scene resumes after fresh PIN login. Record actual p50/p95 mouth-to-speaker timings rather than inferring from backend logs.
- A school administrator signs off publishing **Level 1 only**. Neither this command nor a staff-preview checkbox authorizes Level 2 or other grades.

If the v3 lesson is not staged, use the existing `stage-class1-first-day-parallel.ts` read-only preflight and its *development/test-only* installation process, with actual reviewed media. Never stage into a school DB using a script restricted to the local `test` database.

## 4. Explicit protected publication

After every prerequisite is independently confirmed by a responsible operator:

```powershell
cd D:\talkor\talkor\backend
$env:TALKORA_CLASS1_L01_RELEASE_APPROVED = 'YES'
$env:TALKORA_FIRST_DAY_INTRO_REVIEWED = 'YES'
$env:TALKORA_FIRST_DAY_AUDIO_REVIEWED = 'YES'
$env:TALKORA_CLASS1_L01_DEVICE_TESTED = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts --apply
```

The command uses the configured MongoDB connection, validates the stored records, checks the reviewed HTTPS intro and each S3 narration, then atomically changes the selected Class 1 curriculum, Level 1, v3 Lesson and its ten activities to active/PUBLISHED inside a MongoDB transaction. MongoDB must be transaction capable (replica set or Atlas). It **does not** seed missing content, edit old progress, create extra student unlocks, approve other lessons or silently publish any other grade.

After publication, clear the four operator approval variables from the terminal; they should not be committed to source control. Never paste database credentials, student PINs, recordings or auth tokens in issues.

## 5. Verify publication on the real app

- Staff admin at `/school/curriculum-map?grade=1&level=1` must see **Published · active lessons** with ten active v3 activities when selecting Level 1. A failed live lookup is not a success.
- A fresh Class 1 PIN session must load `/student/continue` into `/student/lesson/<Mongo-Lesson-ObjectId>` (not an integer level), show the required full-screen First Day intro on an initial visit, then start Miss Julie's actual first speaking scene.
- On `/student/levels`, Class 1 shows its ten-stop map with Level 1 CURRENT and Level 2 UPCOMING/locked unless separately published. No direct URL may bypass a grade, intro, prior level or activity completion check.
- Verify correction, silence retry, Hindi/Marathi hints, non-duplicated progress, audible Azure reply receipt, spoken homework and continuation on a new session. The student's completed percentage must come from actual Mongo attempt evidence, not a plan label.
- Repeat the read-only preflight; it should report `ALREADY_PUBLISHED` only if the actual active entities are consistent.

**Hard stop:** do not publish if approval is not actually obtained, media is missing, progress is ambiguous or the microphone/speaker test fails. CI green proves code, not that the school deployment is live.
