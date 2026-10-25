# Talkora — for Developer  & Team Onboarding

> **Talkora** is a voice-first English-learning platform for school students from **KG through Class 10**, guided by **Miss Julie**. This README explains how teammates install, run, test, contribute to, and safely deploy the existing project. **Read it before editing code or pushing to GitHub.**
>
> Repository: **https://github.com/therealsaad/talkor**

## Table of contents

1. [Quick start: run the app](#1-quick-start-run-the-app)
2. [What lives where](#2-what-lives-where)
3. [Installation and environment variables](#3-installation-and-environment-variables)
4. [Run the Python speech service and the Qwen AI brain](#4-run-the-python-speech-service-and-the-qwen-ai-brain)
5. [Voice architecture: Priya, S3, Sarvam and Azure](#5-voice-architecture-priya-s3-sarvam-and-azure)
6. [Generate once, reuse many times: lesson audio](#6-generate-once-reuse-many-times-lesson-audio)
7. [Lessons, curriculum and safe publishing](#7-lessons-curriculum-and-safe-publishing)
8. [Git and GitHub: the workflow every teammate uses](#8-git-and-github-the-workflow-every-teammate-uses)
9. [Tests and the pre-push checklist](#9-tests-and-the-pre-push-checklist)
10. [Deployment and team safety rules](#10-deployment-and-team-safety-rules)
11. [Troubleshooting](#11-troubleshooting)
12. [Existing project documentation](#12-existing-project-documentation)

---

## 1. Quick start: run the app

The primary GitHub repository contains **two independently installed applications**:

- `client/`: Next.js / React frontend (default **port 3000**)
- `backend/`: Node.js / Express / TypeScript / MongoDB backend (default **port 5000**)

The separate **Python TTS service** and **Python Qwen/FastAPI service** are **not included in the supplied main repository ZIP**. Team members who work on AI/voice need approved access to their separate workspace, model files and service credentials. Frontend-only developers do not need to install local LLM weights for every UI change.

### First-time clone — Windows PowerShell

Install **Git**, **Node.js 22 LTS** (recommended; backend declares Node >= 18), and **pnpm 10.18.0**. To enable the repository's package-manager version:

```powershell
node --version
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm --version

git clone https://github.com/therealsaad/talkor.git
cd talkor
```

If your Windows installation does not allow `corepack enable`, ask the lead about your local Node setup, or install `pnpm@10.18.0` with npm. **Use pnpm consistently** and do not commit incidental `package-lock.json` changes.

### Terminal A — backend

```powershell
cd path\to\talkor\backend
pnpm install --frozen-lockfile
Copy-Item .env.example .env       # only if .env does not already exist
# Configure your OWN secrets; see section 3
pnpm run dev
```

Expected: MongoDB connects, and the Express API listens on **http://localhost:5000**.

### Terminal B — frontend

```powershell
cd path\to\talkor\client
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local # only if .env.local does not already exist
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
pnpm dev
```

Open **http://localhost:3000**.

> In PowerShell, `#` starts a comment; do not type the explanatory comments as additional commands. Start each service in its **own terminal** and leave that terminal open.

### Service map

| Port | Component | Required for |
| --- | --- | --- |
| `3000` | Next.js frontend | Browser and student/teacher/school UI |
| `5000` | Express backend | Authentication, curriculum, MongoDB, progress, APIs |
| `8001` | Separate Python TTS/speech service | Local AI4Bharat narration, prewarm/generation when enabled |
| `8002` | Separate Python FastAPI Qwen brain | Guided Class 1 Qwen pilot |
| `11434` | Ollama | Serving `qwen3:4b-instruct` to FastAPI |

Check all ports from a spare terminal:

```powershell
3000,5000,8001,8002,11434 | ForEach-Object {
  "Port $_ : $((Test-NetConnection 127.0.0.1 -Port $_ -WarningAction SilentlyContinue).TcpTestSucceeded)"
}
```

**Do not start two processes on the same port.** A port already in use might be a healthy existing service; inspect it first.

---

## 2. What lives where

```text
 talkor/
 ├── README.md                          ← this handbook
 ├── docs/                              ← architecture, team ownership, release notes
 ├── tools/                             ← source checks, 110-level checks, load tests
 ├── client/
 │   ├── app/                           ← Next.js routes: student, school, teacher
 │   ├── components/                    ← reusable student/lesson UI, Miss Julie
 │   ├── features/lessons/
 │   │   ├── registry.ts                ← canonical 110-level lazy registry
 │   │   └── grades/
 │   │       ├── kg/level-01/           ← KG Level 1 workspace
 │   │       ├── class-01/level-01/     ← Class 1 Level 1 workspace
 │   │       └── ...                   ← other class/level workspaces
 │   ├── public/lessons/               ← approved, optimized per-level visual assets
 │   ├── services/                     ← frontend API clients
 │   └── package.json
 └── backend/
     ├── src/app.ts                     ← Express app and /api + /api/v1 mounts
     ├── src/server.ts                  ← database connection and API server
     ├── src/models/                    ← MongoDB/Mongoose data models
     ├── src/routes/                    ← authenticated API routes
     ├── src/services/                  ← curriculum, progress, S3, voice, auth logic
     ├── src/providers/                 ← AI, speech and voice provider adapters
     ├── src/kg/                        ← authoritative KG alphabet/audio content
     ├── src/curriculum/                ← roadmap and class content
     ├── src/scripts/                   ← safe audits, migration and audio scripts
     ├── tests/                         ← Jest unit/integration tests
     └── package.json
```

**Do not make a second student lesson engine or a new `app/` for each grade.** The existing database relationship is `CurriculumClass → Level → Lesson → Activity`. Existing backend controls must own authorization, grading, completion and progress. The frontend may display results but must not invent scores or unlocks.

**Canonical addresses:** KG `g00-l01` through `g00-l10`; Class 1 `g01-l01` through `g01-l10`; ... Class 10 `g10-l01` through `g10-l10`. **110 registered workspaces ≠ 110 published lessons.**

Important routes (verify current checkout):

- Student PIN login: `/login/student`
- Student continue/resume: `/student/continue`
- Authenticated student lesson: `/student/lesson/[id]`
- KG pilot: `/student/kg` and teacher preview `/school/kg-preview`
- School curriculum map: `/school/curriculum-map`
- Staff level editor/preview: `/school/curriculum-studio/[grade]/[level]`
- Express health check: `GET http://localhost:5000/health`
- Express API mounts: `/api/*` and `/api/v1/*`

The **staff-only level design workspace is not the actual student lesson**. Preserve this distinction.

---

## 3. Installation and environment variables

### Never share private `.env` files

Copy the example files and fill in values locally. Ask the team lead to provision **least-privilege, revocable developer credentials**. Do **not** copy a teammate's real `.env` into GitHub or a group chat.

**Frontend** — `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Enable animation feature flags only when the approved clips exist.
# NEXT_PUBLIC_MISS_JULIE_ANIMATIONS=true
```

Anything named `NEXT_PUBLIC_*` is exposed to the browser. Never put API keys, S3 write credentials or secrets there.

**Backend** — `backend/.env` example values (illustrative only; not an exhaustive replacement for `backend/.env.example`):

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=<provided-developer-MongoDB-Atlas-URI-with-explicit-database-name>
JWT_SECRET=<long-unique-secret-from-team-lead>

# Existing default conversation provider. The authorized Class 1 pilot
# can override this ONLY if the latest routing patch is installed/tested.
AI_PROVIDER=groq
GROQ_API_KEY=<developer-key>
SPEECH_PROVIDER=sarvam
SARVAM_API_KEY=<developer-key>
SARVAM_STT_MODEL=saaras:v4
SARVAM_STT_LANGUAGE=unknown
SARVAM_STT_MODE=codemix

# Qwen pilot: separate FastAPI brain, NOT the local TTS service.
TALKORA_CLASS1_QWEN_PILOT=true
TALKORA_CLASS1_AI_URL=http://127.0.0.1:8002
AI_SERVICE_TIMEOUT_MS=90000

# Existing Python TTS endpoint and approved output voices.
AI_SERVICE_URL=http://127.0.0.1:8001
VOICE_PROVIDER=azure
CONVERSATION_VOICE_PROVIDER=azure
KG_VOICE_PROVIDER=s3
AZURE_SPEECH_KEY=<developer-key>
AZURE_SPEECH_REGION=centralindia

# Required for approved audio upload/read via S3Service.
AWS_REGION=<aws-region>
AWS_ACCESS_KEY_ID=<developer-access-key>
AWS_SECRET_ACCESS_KEY=<developer-secret-key>
AWS_S3_BUCKET=<approved-private-bucket-name>
```

Use your **actual** `backend/.env.example` to find additional required/optional settings. Only one effective definition of each variable should be present. Repeated `AI_PROVIDER`, `SPEECH_PROVIDER` or `TALKORA_CLASS1_AI_URL` values make debugging needlessly difficult.

**Qwen routing note:** `AI_PROVIDER=groq` + the scoped pilot flags is appropriate **only if** your branch has the Class 1 provider-isolation update. If it does not, `AI_PROVIDER=qwen` selects Qwen globally. Verify the current `backend/src/providers/ai/index.ts` and `QwenProvider.ts` before changing an already-working setup. **Groq STT does not imply Groq must be the conversational LLM.**

**MongoDB safety:** Atlas is fine; you do **not** need a separate local MongoDB server. If an Atlas URI omits the database path, Mongoose may connect to a database named `test` (as happened during Class 1 pilot work). Always inspect the database name and its data before running any seed or migration. Do not point a developer's seed script at live school data without review, a backup and explicit approval.

**Security:** Never run a full `seed`, migration, `--apply`, index migration, or bulk curriculum publishing command casually. Audit and dry-run first; verify whether it writes or deletes data.

---

## 4. Run the Python speech service and the Qwen AI brain

The AI/TTS workspaces are **separate from the main GitHub repository** in the team's current setup. The paths below are the original developer's Windows machine paths; each teammate may use different paths after the lead grants access.

### Terminal C — AI4Bharat / speech TTS service (`8001`)

Example existing workspace:

```powershell
cd "D:\allabouttalkora\live_talkora\talkora1\talkora\ai-service"
.\.venv-talkora\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The currently inspected KG audio generation script expects `POST /v1/tts`, with a verified OpenAPI contract, on this service. Confirm it starts before generating any new clips:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/openapi.json |
  Select-Object -ExpandProperty info
```

If you do not have this workspace or its voice checkpoints, **ask the AI/voice owner**; do not invent a new `ai-service` project or substitute an unrelated voice and call it approved AI4Bharat output.

### Terminal D — Ollama (`11434`)

```powershell
ollama list
ollama serve
```

This service may already be started by the Ollama desktop application. If you see a bind error on `11434`, first check whether the existing server is healthy:

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/tags |
  Select-Object -ExpandProperty models |
  Select-Object name
```

The Class 1 pilot uses `qwen3:4b-instruct`. If the model is missing, arrange the permitted download with the AI lead, then verify with `ollama list`. On a lab or developer machine with insufficient RAM/VRAM, use the team's hosted service instead of attempting unsupported local inference.

### Terminal E — Python FastAPI Class 1 Qwen service (`8002`)

Example existing workspace:

```powershell
cd "D:\allabouttalkora\live_talkora\talkora1\talkora\ai-models\talkora-ai-starter"
.\.venv\Scripts\Activate.ps1
$env:TALKORA_CLASS1_QWEN_PILOT = 'true'
$env:OLLAMA_MODEL = 'qwen3:4b-instruct'
$env:OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
python -m uvicorn server.main:app --host 127.0.0.1 --port 8002
```

Verify the OpenAPI document:

```powershell
Invoke-RestMethod http://127.0.0.1:8002/openapi.json |
  Select-Object -ExpandProperty info
```

Do not confuse `8001` (**TTS**) and `8002` (**Qwen brain**). Earlier development tests failed simply because Node was configured for **8012** while FastAPI actually listened on **8002**. Always keep `TALKORA_CLASS1_AI_URL` in sync with the actual FastAPI port.

Once installed, check the existing Class 1 bridge script **if it is present in your branch**:

```powershell
cd path\to\talkor\backend
pnpm exec tsx src/scripts/check-class1-ai-bridge.ts
```

`bridgeStatus: PASS` means **Node → Python → Qwen provider connectivity worked**. It does **not** by itself prove student login, microphone, persisted progress, audio playback or lesson completion.

### Python tests (if you have the separate AI workspace)

```powershell
cd "D:\allabouttalkora\live_talkora\talkora1\talkora\ai-models\talkora-ai-starter"
.\.venv\Scripts\Activate.ps1
python -m pytest -q tests/test_class1_response_guard.py tests/test_class1_compat.py tests/test_compat.py
```

The team previously saw **16 passing tests** in this Python workspace. Rerun after any AI prompt/adapter change. A clean response format still needs real inference testing; a working test client alone is not enough.

---

## 5. Voice architecture: Priya, S3, Sarvam and Azure

**Never confuse LLM intelligence with text-to-speech (TTS).** They are different steps.

```text
FIXED, HUMAN-REVIEWED LESSON LINE
  Level/Activity content → approved voice script → AI4Bharat TTS (:8001)
                           → review audio → upload to private S3 once
  Student opens activity → authenticated Talkora backend → S3 clip → browser plays it
                          (same recording reused by many students)

DYNAMIC CLASS 1+ TEACHING TURN
  Student microphone → Sarvam Saaras v4 (English/Hindi/Marathi) → authenticated Node activity context
  → FastAPI :8002 → Ollama Qwen :11434 → structured Miss Julie coaching text
  → approved dynamic voice path (currently Azure) → browser playback
  → server-owned activity evaluation/progress (MongoDB)

KG LEVEL 1
  Scripted ABCD lesson + positive, deterministic response after Sarvam STT
  → reviewed Priya clips in private S3, reused between students/visits; NO Qwen required
  Saying Hindi/Marathi meaning is praised, then English word is modeled;
  it does not count as successful spoken English or unlock the next task.
```

| Service | Responsibility | Rule |
| --- | --- | --- |
| **AI4Bharat TTS** | Generate **fixed/approved** lesson narration | Generate offline/in a controlled batch; human-review output |
| **Amazon S3** | Store versioned narration recordings and compatible cache objects | Reuse clips; do not upload every time a student opens a level |
| **Sarvam Saaras v4 STT** | Transcribe child speech in English, Hindi and Marathi | A transcript alone is **not** proof of accurate pronunciation |
| **Qwen** | Guided Class 1 coaching and hints | Bounded to the approved lesson; never owns mastery or unlock rules |
| **Azure voice** | Speak **new, dynamic** Miss Julie replies | No persistent S3/Atlas cache for personal coaching; store only reviewed curriculum audio |
| **MongoDB Atlas** | Curriculum, attempts, progress, voice cache metadata | Avoid destructive seeds; protect child data |

The existing Node backend has `S3Service`, `AudioCacheService`, `kg-static-audio-cache` and authenticated voice/KG routes. **Reuse these services** rather than creating separate public S3 URLs or duplicating caching logic.

### Three important cache mechanisms

1. **Immutable KG lesson clips:** versioned S3 objects such as `kg/level-1/miss-julie/v1/say-a.mp3`; the KG backend reads them with `S3Service.getAudio()` and a small bounded in-process cache. KG audio route: `/api/kg-alphabet/audio/{version}/{id}` for an authorized student (the same route is also mounted under `/api/v1`).
   KG feedback IDs (`bridge-a` through `bridge-d`, `model-a` through `model-d`, `great`, `silence`, etc.) use the same manifest and S3 route; no per-child clip generation or upload. If a clip is missing, S3 mode reports an error so it can be reviewed/published, rather than silently spending Azure credits every retry.
2. **Legacy general TTS cache:** `AudioCacheService.cacheKey()` hashes normalized text + provider + voice + rate + pitch + format + version. Azure live teaching/feedback **bypasses this S3 cache** under the new policy.
3. **Login prewarming:** the existing `SyllabusVoiceWarmupService` can send shared fixed lesson lines to `/v1/tts/prewarm`, while personalized guidance has a separate context. Only active/published lesson content is included by default. Do not confuse prewarming with creating final approved S3 files.

**Access:** Treat the S3 bucket as private. The backend should authenticate a student and authorize the activity before reading/streaming its recording. If a reviewed frontend lesson requires a CDN base URL, use an explicitly authorized distribution mechanism; **never** expose AWS write credentials in `NEXT_PUBLIC_*`, and do not assume a private S3 object URL is playable in the browser.

---

## 6. Generate once, reuse many times: lesson audio

### A. KG Level 1 — implemented versioned pipeline

Source of truth:

- `backend/src/kg/alphabet-content.ts`: `AUDIO_LINES`, `AUDIO_MANIFEST`, `KG_AUDIO_VERSION`, `audioKey()`
- `backend/src/scripts/kg-level1-audio.ts`: audio generation, checks, upload and verification
- `backend/src/services/S3Service.ts`: private S3 access
- `backend/src/services/kg-static-audio-cache.ts`: bounded server-side playback cache
- `backend/src/controllers/kg-alphabet.controller.ts`: authenticated audio delivery

The inspected KG pipeline uses **`miss-julie-priya-v6`** as its pinned approved voice preset, obtains audio from the local `8001` `/v1/tts` endpoint, validates WAV, converts to MP3 with `ffmpeg`, and checks output using `ffprobe`. It refuses unexpected voice/schema changes. The code's exact current manifest and voice settings take precedence over this description.

Install **FFmpeg**, ensuring both `ffmpeg` and `ffprobe` are on `PATH`:

```powershell
ffmpeg -version
ffprobe -version
```

From the backend folder, run these steps **in order**:

```powershell
cd path\to\talkor\backend

# 1. Show precisely what the script would generate. NO writes.
pnpm exec tsx src/scripts/kg-level1-audio.ts --all --dry-run

# 2. Generate one approval sample (requires service :8001).
pnpm exec tsx src/scripts/kg-level1-audio.ts --sample

# 3. Listen to the sample and get voice/content approval.
# 4. Generate the full versioned local library.
pnpm exec tsx src/scripts/kg-level1-audio.ts --all

# 5. If interrupted, resume matching clips instead of regenerating.
pnpm exec tsx src/scripts/kg-level1-audio.ts --all --resume

# 6. Validate/check S3 destinations before writing.
pnpm exec tsx src/scripts/kg-level1-audio.ts --upload --dry-run

# 7. Upload ONLY after approval and with authorized AWS credentials.
pnpm exec tsx src/scripts/kg-level1-audio.ts --upload

# 8. Verify objects + checksums after upload.
pnpm exec tsx src/scripts/kg-level1-audio.ts --verify
```

Local generation writes under `backend/tmp/kg-level1-audio/` by default. The S3 audio key shape is:

```text
kg/level-1/miss-julie/v1/<clip-id>.mp3
```

**The lesson itself should load the existing authenticated backend audio URL**, rather than synthesize the same line again. When `KG_VOICE_PROVIDER=s3`, the KG controller retrieves the approved clip; if unavailable, inspect the current controller's fallback/error behavior and report missing recordings instead of silently claiming successful caching.

### B. Class 1 Level 1 — nine-line AI4Bharat manifest (integration in progress)

The post-ZIP Class 1 patch introduced these files **if present in your checkout**:

- `backend/src/scripts/class1-level1-ai4bharat-lines.json`
- `backend/src/scripts/upload-class1-level1-audio.ts`

The currently supplied manifest defines **nine** reviewable lines for activities such as `listen-at`, `build-at`, `listen-in`, `build-in`, encouragement and homework. The planned private S3 key shape is:

```text
class-01/level-01/v1/<clip-id>.wav
```

**No generated WAV files were included in the patch.** The voice must be generated with the approved AI4Bharat runtime and reviewed. Once files have been placed locally as `<clip-id>.wav` in one folder:

```powershell
cd path\to\talkor\backend

# READ-ONLY preview; files must already exist.
pnpm exec tsx src/scripts/upload-class1-level1-audio.ts "D:\talkora-approved-audio\class1" 

# Writes approved, missing objects only. Requires authorized AWS credentials.
pnpm exec tsx src/scripts/upload-class1-level1-audio.ts "D:\talkora-approved-audio\class1" --upload
```

The uploader checks WAV signatures, calls `S3Service.headAudio()` and skips keys that already exist; uploads use a no-overwrite condition. **This uploader does not make Class 1 student playback work by itself.** The existing staff preview's optional `NEXT_PUBLIC_TALKORA_CLASS1_AUDIO_BASE_URL` requires an authorized audio distribution path; the real authenticated student route still needs end-to-end verification. Never put private S3 bucket URLs into a public client environment variable.

### C. How to add or change a voice line safely

1. Update the **authoritative lesson content and manifest**; don't write independent, hard-coded voice strings into arbitrary React components.
2. Choose the approved **text, language, voice preset, speaking rate and content revision**.
3. Normalize punctuation/spacing, and have a teacher review the wording and phonics.
4. For a **new clip**, generate with AI4Bharat in an offline/batch job. For an **unchanged clip**, reuse the existing versioned S3 object.
5. Listen to and approve the actual audio with headphones, especially the pronunciation of **short two-letter words**.
6. Upload to the correct **new versioned key** and record its manifest/checksum/content type.
7. Verify the S3 object (HEAD/checksum where supported) and playback through the **authorized route**.
8. Only after the new version is verified, update the client/backend manifest references. Keep the old version until dependent clients are safely migrated.
9. Regression-test KG and Class 1; check no repeated TTS calls on refresh or across students.

**Never overwrite an existing immutable S3 key with different audio.** New wording or a different speaker must get a **new version**. The cache identity must include the factors that change synthesized sound. This is how thousands of students can hear the same reviewed clip without thousands of generation requests.

---

## 7. Lessons, curriculum and safe publishing

### KG Level 1

- Canonical ID: `g00-l01`
- Scripted ABCD learning and dedicated introductory video flow
- Existing teacher preview, KG speech/child-tolerance checks, S3/static-audio support
- **Do not connect KG to the Class 1 Qwen pilot**
- Do not remove the mandatory intro, change the shared student login or destroy saved KG progress

### Class 1 Level 1

- Canonical ID: `g01-l01`
- Student learning goal: **two-letter English words** (`am`, `an`, `at`, `in`, `is`, `it`, `on`, `up`), with phonics and speaking practice
- Intended sequence: **listen → recognize → build → speak → short use-in-context → guided Qwen coaching → homework**
- Static, reviewed narration: AI4Bharat → S3 (planned/partly wired)
- Dynamic guidance: authenticated Node provider → FastAPI `8002` → Qwen (provider bridge verified in development)

**Observed during development (Oct 22, 2026):** the Class 1 pilot seed created a **draft** `CurriculumClass`, `Level`, `Lesson`, and **seven** MongoDB activities; a second seed inserted **zero duplicates**. The Node Qwen bridge passed, with a roughly 3.5-second response. At that time, the Class 1 student-authenticated lesson, voice/audio and MongoDB progress still required end-to-end validation. **Do not claim a draft is published or that a successful provider test proves student playback.** Inspect the latest Codex branch for subsequent fixes.

Normal student access requires publication/access checks. Development-only access flags (if your branch implements them):

```dotenv
TALKORA_CLASS1_STUDENT_DEMO=true
TALKORA_CLASS1_DEMO_STUDENT_ID=<approved-24-character-test-student-object-id>
```

Use only a test account in development, with server-side identity checks; disable the demo after review. **Never bypass school/grade ownership or enable global draft access.**

### Syllabus and content review

- Preserve the same `CurriculumClass → Level → Lesson → Activity` schema, current lesson registry and progress engine.
- Support English foundations and the approved Maharashtra Balbharati curriculum **in parallel**.
- Verify textbook name, edition, chapter and page references before setting any `syllabusVerified` flag.
- No copied third-party solution bank, fabricated chapter attribution or invented student mastery.
- Qwen can give bounded, compassionate hints; the **backend**, not the LLM, grades deterministic activities and manages progression.
- Prioritize child-friendly Hindi/Marathi scaffolding; speech transcripts alone are unreliable pronunciation scores.

### Who edits what

The current project already includes `docs/TEAM_QUICK_START.md`; coordinate ownership with the lead. As a practical starting point:

| Responsibility | Primary files/folders | Coordinate before changing |
| --- | --- | --- |
| Frontend / Class 1 author | `client/features/lessons/grades/class-01/`, matching `client/public/lessons/` assets | Authenticated student lesson engine, shared controls |
| KG specialist | `client/features/lessons/grades/kg/`, `backend/src/kg/` and KG tests | Live KG pilot, speech scoring, intro/video gates |
| Backend developer | `backend/src/routes`, `services`, `models`, `controllers` | Auth, schema migrations, lesson publication |
| AI developer | `backend/src/providers/ai/`, separate Python brain | Qwen prompts, context, response schemas and timeouts |
| Voice/audio developer | `backend/src/scripts`, `S3Service`, approved manifests, separate TTS service | Voice preset, storage keys, S3 writes and public playback |
| Lead/reviewer | Shared registry, curriculum policy, authentication and deployment | Production releases and compatibility |

---

## 8. Git and GitHub: the workflow every teammate uses

**Team rule: work on a feature branch, open a pull request (PR), get review, merge to `main` only after checks pass.** Do not push unreviewed work directly to `main`.

### A. One-time setup

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-work-email@example.com"

git clone https://github.com/therealsaad/talkor.git
cd talkor
git remote -v
git status
```

Authenticate to GitHub using an approved login/credential manager or SSH. GitHub requires appropriate repository access for pushing; being able to clone does not guarantee write access. If you cannot push to the team repo, fork it and create a PR from your fork.

### B. Every morning, update your local branch

```powershell
cd path\to\talkor
git status --short
git switch main
git pull --ff-only origin main
```

**If you have local edits**, do not switch/pull over them. Commit them on their feature branch first, or use `git stash push -u -m "WIP before updating main"` deliberately and restore with `git stash pop`. Review the stash result for conflicts. Do not stash generated secrets or model weights into commits.

### C. Create a branch for your assigned task

```powershell
git switch -c feature/class1-two-letter-words
# Other patterns: fix/kg-microphone, feat/ai4bharat-audio-cache, docs/team-readme
```

Make small changes inside your assigned files. Do not overwrite another teammate's uncommitted work or apply old ZIP patches blindly. Coordinate changes to shared `routes`, `registry`, `auth`, `progress` or database models.

### D. Check, stage and commit only relevant files

```powershell
git status --short
git diff --check
git diff

# Example: stage only the assigned lesson assets/code, not all local files.
git add client/features/lessons/grades/class-01/level-01/
git add client/public/lessons/class-01/level-01/

git diff --cached --stat
git diff --cached
git commit -m "feat(class1): add two-letter word activities"
```

Never stage `.env`, credentials, student exports, private voice recordings, model weights, `.venv`, `node_modules`, `.next`, build output or accidental backup ZIPs. In this repository the root/nested `.gitignore` files may be imperfect; **`git status` and `git diff --cached` are mandatory**. Also check:

```powershell
git check-ignore backend/.env client/.env.local
git ls-files backend/.env client/.env.local
```

The second command **must not show a tracked secret file**. If credentials were ever committed, inform the lead and **rotate them immediately**; adding `.gitignore` alone does not remove Git history.

### E. Push a branch and create a PR

```powershell
git push -u origin feature/class1-two-letter-words
```

On GitHub, select **Compare & pull request** and target **`main`**. Include:

- Summary of exactly what changed and why
- Paths/modules affected; screenshots/video for UI changes
- Tests performed **with real pass/fail output**
- MongoDB migrations or S3 changes, if any (dry-run and rollback plan)
- Whether the content is draft, staff-only, or published
- Confirmation that KG and other grades were not regressed

Request review from the owner of any shared backend/AI/curriculum files. Only a designated reviewer merges approved work.

### F. Handle remote updates / push rejection safely

If Git says **non-fast-forward** or asks you to pull, **do not force-push `main`**:

```powershell
git status
git fetch origin
git switch feature/class1-two-letter-words
git rebase origin/main
# If conflict: fix the listed files, stage them, then:
git add <resolved-file-path>
git rebase --continue
# To cancel a troubled rebase: git rebase --abort
```

If your feature branch is already shared and rebasing would rewrite others' work, coordinate with the lead before rewriting history. A normal `git merge origin/main` on the feature branch can be safer for shared branches. Use `--force-with-lease` **only on your own branch with team approval**, never on protected `main`.

### G. After PR merge

```powershell
git switch main
git pull --ff-only origin main
git branch -d feature/class1-two-letter-words
```

Do not delete a branch that still contains unmerged commits. Keep PRs small, one goal per PR.

### Good commit messages

```text
feat(class1): add two-letter word recognition
fix(kg): preserve repeat-audio playback
test(ai): cover qwen response timeout
docs: add teammate setup and S3 cache guide
chore: update reviewed curriculum manifest
```

---

## 9. Tests and the pre-push checklist

Run the tests relevant to your changes. **Do not claim the app is production-ready just because TypeScript passes.**

### Shared structural checks (from repository root)

```powershell
node tools/verify-110-levels.cjs
node tools/test-curriculum-map.cjs
```

Some older structural tests in the October ZIP require `activities.ts` to be **empty** in every level workspace. Since Class 1 now has real authored activities, those tests may need a reviewed update. **Do not erase legitimate Class 1 content to make an outdated source-pattern assertion pass.** Update the tests to enforce the real publishing and registry rules.

### Frontend

```powershell
cd path\to\talkor\client
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm test:kg-pilot-ui
pnpm test:kg-speech
```

Use whichever additional UI tests exist in your *current* branch. The root `tools/verify-on-windows.ps1` runs a wider suite and may need live development infrastructure.

### Backend

```powershell
cd path\to\talkor\backend
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Jest integration tests may use `mongodb-memory-server` and download a MongoDB test binary; a download failure is not necessarily a Talkora application failure. Never run destructive test or seed scripts against a real school database.

### AI / audio / live tests

```powershell
# From backend, when the applicable scripts are in your branch:
pnpm exec tsx src/scripts/check-class1-ai-bridge.ts
pnpm exec tsx src/scripts/audit-class1-l01-readiness.ts
pnpm exec tsx src/scripts/kg-level1-audio.ts --verify
```

The Class 1 audit is designed as a read-only inspection. The KG `--verify` call checks S3 and needs valid AWS read permissions; it is **not** an audio-generation command.

**Manual acceptance on an actual browser and student test account:**

- KG: mandatory intro, Miss Julie animations, touch/speak/retry, S3 audio, progress and homework.
- Class 1: approved two-letter word screen, test PIN login, `/api/students/me/next-lesson` and `/api/students/me/progress`, real microphone/STT, Qwen coaching, voice reply, retries, saved/resumed progress and homework.
- Auth: another student's PIN must **not** access an unpublished draft.
- Audio: two students opening the same level should **reuse** reviewed recordings, not call AI4Bharat twice.
- Accessibility: captions/instructions, microphone-permission errors, readable buttons, reduced-motion behavior.

### Developer's pre-push checklist

- [ ] My branch is based on the current reviewed `main`.
- [ ] I changed only the intended project files.
- [ ] No `.env`, access keys, student data or generated secrets are staged.
- [ ] Relevant TypeScript/build/tests passed or known failures are documented.
- [ ] I verified lesson route, permissions, audio and progress if relevant.
- [ ] I did not accidentally publish a draft or migrate production data.
- [ ] I documented S3 object/version changes and did not replace immutable clips.
- [ ] I reviewed `git diff --cached` before `git push`.
- [ ] I opened a PR and requested the right reviewer.

---

## 10. Deployment and team safety rules

Current deployment approach discussed by the team: **Vercel for frontend**, **Railway for Node backend**. Confirm the real environments with the release lead; local ports and paths are not deployment URLs.

- **Frontend (`client/`)**: Vercel project root should be the appropriate frontend directory; configure `NEXT_PUBLIC_API_URL` to the **public HTTPS backend URL including `/api`**. Build with the existing pnpm lockfile. Do not put secrets in frontend variables.
- **Node (`backend/`)**: Railway project root/commands should match the backend package scripts; configure all necessary backend environment variables, MongoDB Atlas access, AWS and Azure/Groq credentials and allowed frontend origins.
- **FastAPI/Ollama/TTS**: **`127.0.0.1` on your laptop is not reachable from deployed Vercel/Railway**. Before enabling live Class 1 AI, deploy a securely reachable backend-to-AI service or approved private network endpoint. Do not expose Ollama publicly without access controls.
- **Railway internal hostnames** such as `*.railway.internal` cannot be assumed reachable directly from the Vercel browser. Browsers need an appropriate public HTTPS API, while private services should stay behind your Node backend.
- **S3**: Keep objects private, use least-privilege IAM, version immutable lesson keys, verify object access via an authenticated backend route or deliberately configured secure distribution.
- **Database**: Use explicit development/staging/production database names and backups. Never run `pnpm seed`, migration `--apply`, `curriculum:map:apply` or lesson publishing automatically during deployments.
- **Children's data**: Restrict logs and prompts, validate student access server-side, avoid persisting raw voice unnecessarily, and keep shared-computer sessions short/nonpersistent.

**Permission boundary:** Only designated leads should change production settings, merge to protected `main`, publish curriculum or modify cloud storage permissions. No developer should claim **10,000 concurrent users** are supported without measured load tests.

---

## 11. Troubleshooting

| Symptom | Likely cause / safe first action |
| --- | --- |
| `AI_SERVICE_UNAVAILABLE` / `fetch failed` | Confirm backend `TALKORA_CLASS1_AI_URL`, FastAPI port and exact URL; Node once pointed at **8012** while FastAPI ran at **8002**. |
| Python `/v1/brain/respond` returns **502** | Check Ollama `11434`, installed model `qwen3:4b-instruct`, Qwen logs, response JSON validity and timeouts. |
| `WinError 10048` on `8002` or `11434` | Something already binds the port. Inspect owner; don't kill unrelated Python/Ollama processes blindly. |
| `WinError 10013` | Binding blocked/reserved by Windows; inspect port exclusions and existing processes; try without Uvicorn reload. |
| `/api/students/me/progress` or `/next-lesson` returns **404** | Inspect authenticated role, student/class/level publication state and existing curriculum-access rules; draft lessons are not normally student-visible. Do not globally publish to silence a 404. |
| Python `No module named pytest` | Activate the **correct** `.venv` for `talkora-ai-starter`, then `python -m pip install pytest`. |
| TTS/S3 clip missing | Verify KG/Class 1 manifest version, S3 bucket/key, AWS permissions, `--verify` result and authenticated playback route. Do not regenerate on every request. |
| “Can't play Class 1 audio” | The nine-line uploader does **not** automatically provide an authorized browser URL or final student playback integration. |
| Wrong Miss Julie voice | Confirm provider/voice preset/version; reject mismatched KG contracts; don't mix clips from different generations under one immutable prefix. |
| `git push` rejected | `git fetch origin`, reconcile changes on your feature branch, then push again; do not force-push `main`. |
| `git diff --check` reports `^M` or whitespace | Review affected file line endings; normalize only the intended files, not a blanket formatting rewrite of KG. |
| `tsc` passes but lesson fails | Test authenticated routes, MongoDB publication, missing media, microphone permissions and progress on a real browser; compilation cannot confirm them. |

Useful diagnostics (no secrets printed):

```powershell
# Running services:
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in 3000,5000,8001,8002,11434 } |
  Select-Object LocalAddress,LocalPort,OwningProcess

# Healthy backend:
Invoke-RestMethod http://127.0.0.1:5000/health

# AI API definitions:
Invoke-RestMethod http://127.0.0.1:8002/openapi.json |
  Select-Object -ExpandProperty info

# Show current Git branch + changes:
git branch --show-current
git status --short
```

---

## 12. Existing project documentation

Read these files **from your current branch** before making broad changes:

- [`docs/TEAM_QUICK_START.md`](docs/TEAM_QUICK_START.md): teammate area ownership and sample branch workflow.
- [`docs/110_LEVEL_TEAM_ARCHITECTURE.md`](docs/110_LEVEL_TEAM_ARCHITECTURE.md): architecture contracts, level registry, lesson and publication rules.
- [`docs/110_LEVEL_MAPPING_AND_TEAM_HANDOFF.md`](docs/110_LEVEL_MAPPING_AND_TEAM_HANDOFF.md): migration and handoff.
- [`docs/20_REQUIREMENTS_VERIFICATION.md`](docs/20_REQUIREMENTS_VERIFICATION.md): historic requirements and verification evidence, not a guarantee for current code.
- [`backend/README.md`](backend/README.md): backend auth/API/model description; note that parts may describe an earlier release.
- [`client/features/lessons/grades/kg/level-01/README.md`](client/features/lessons/grades/kg/level-01/README.md): KG ownership/authoring.
- [`client/features/lessons/grades/class-01/level-01/README.md`](client/features/lessons/grades/class-01/level-01/README.md): Class 1 workspace instructions; update it when student functionality is actually verified.

### The golden rule

> **One Talkora app. One existing curriculum engine. One source of truth per lesson. Reviewed narration generated once and reused from S3. Qwen teaches within the activity, but the backend owns safety, progress and publication. Every change goes through a tested feature branch and reviewed PR.**
