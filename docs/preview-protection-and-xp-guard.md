# Talkora — Issue #67 & PR #69: Preview Protection, Staff Authorization & XP Presentation Guard

**Author:** Antigravity (Lead Product Designer & Senior Frontend Engineer)  
**Date:** October 31, 2026  
**Reference:** [Issue #67](https://github.com/therealsaad/talkor/issues/67) · [Pull Request #69](https://github.com/therealsaad/talkor/pull/69)  
**Branch:** `feature/issue-67-preview-guard`  
**Status:** Refined & Hardened per Project Manager Review  

---

## 1. Objectives & Scope

In accordance with Project Manager review instructions for PR #69:
1. **Server-Verified Staff Authorization & Developer-Only Access:** Make the classroom preview developer-only in production, or protect it with proper server-verified staff authorization.
2. **Prevent Anonymous and Student Interaction:** When access is disallowed, anonymous users and students must be completely blocked from mounting or interacting with the sandbox.
3. **Remove Standalone Preview HTML from Public Access:** Remove `client/public/classroom-preview.html` from production static file serving.
4. **Preserve Earned vs Potential XP Distinction without Assumptions:** Maintain strict separation between earned XP and potential target XP, explicitly documenting that `SmartLearningBoard` formats values and does not assume the prop itself validates backend evidence.
5. **Route-Access & Browser Tests, and Production Build Verification:** Add automated route-access unit and browser test suites, and verify production build behavior (`next build`).
6. **Preserve Production Lesson Engine & Gates:** Zero changes to `LessonExperience`, `ImmersiveLessonStage`, speech APIs, progress sync, or introductory-video gates.

---

## 2. Implemented Safeguards

### 2.1 Genuine Server-Verified Staff Authorization (`checkClassroomPreviewAccess`)
Located in [`client/lib/classroom-preview-guard.ts`](../client/lib/classroom-preview-guard.ts) and consumed by [`client/app/classroom-preview/page.tsx`](../client/app/classroom-preview/page.tsx):
* **Production Environment (`process.env.NODE_ENV === 'production'`):**
  * **Verified Educators (`role === 'TEACHER' || role === 'SCHOOL_ADMIN'`):** Authorized to access the sandbox with explicit staff disclaimer.
  * **Anonymous Users (`status === 'unauthenticated'`):** Access is strictly blocked (`production_unauthenticated`). Triggers `router.replace('/login/school')` and renders an `Access Restricted` lock gate.
  * **Students (`role === 'STUDENT'`):** Access is strictly blocked (`student_blocked`). Triggers `router.replace('/student/continue')` and renders an `Access Restricted` student gate.
* **Development Environment (`process.env.NODE_ENV !== 'production'`):**
  * **Developers & Educators:** Authorized in local dev mode.
  * **Students (`role === 'STUDENT'`):** Strictly blocked and redirected to `/student/continue`. Students are never permitted in the sandbox in any environment.
* **Loading State Protection:** While session authentication is in flight (`status === 'loading'`), rendering is suspended with an accessible loading indicator. Under no circumstances is the sandbox mounted prematurely.
* **Zero Component Mounting for Disallowed Users:** If access is disallowed or loading, `MissJulieTeachingStage`, `VoiceInteractionBeacon`, `SmartLearningBoard`, and simulation controls are **never mounted in the DOM**.

### 2.2 Removal of Standalone HTML from Public Serving
* Executed `git rm client/public/classroom-preview.html`.
* Standalone preview HTML is completely removed from `client/public/`, eliminating any unauthenticated direct URL access in production static file serving.

### 2.3 Strict XP Presentation Architectural Contract
Located in [`client/components/student/lesson/smart-learning-board.tsx`](../client/components/student/lesson/smart-learning-board.tsx):
* **Architectural Separation:** `SmartLearningBoard` is a presentation component. It explicitly documents that it does not perform backend evidence verification itself. The caller/lesson orchestrator is strictly responsible for providing server-verified values.
* **Props Distinction:**
  * `earnedXp?: number` (with alias `confirmedXp`): Only to be provided when verified by server response (e.g. `/api/lessons/complete`). When $> 0$, renders `+{earnedXp} XP (Earned)` with trophy badge.
  * `potentialXp?: number`: Target XP available for the activity. Strictly renders with neutral unearned styling as `Goal: {potentialXp} XP` without `+` or `(Earned)` labels.
* **Classroom Preview Sandbox Safety:** The preview passes `potentialXp={15}` and leaves `earnedXp` undefined. Even upon simulated recording completion, feedback explicitly specifies: `Simulated Demo (0 XP Awarded) · Real XP is recorded only after verified backend attempts in official lessons.`

---

## 3. Responsive Verification & Screenshots

Real screenshots captured via Chromium headless across 4 key responsive viewports:

| Viewport | Dimensions | Target Device | File |
| :--- | :--- | :--- | :--- |
| **Mobile** | $390 \times 844$ | iPhone 14 / Phone | [`docs/screenshots/classroom-preview-mobile-390x844.png`](screenshots/classroom-preview-mobile-390x844.png) |
| **School Netbook / 4:3** | $1024 \times 768$ | Older School Lab Monitor | [`docs/screenshots/classroom-preview-lab-1024x768.png`](screenshots/classroom-preview-lab-1024x768.png) |
| **School Laptop / 16:9** | $1366 \times 768$ | Common Indian Lab Laptop | [`docs/screenshots/classroom-preview-lab-1366x768.png`](screenshots/classroom-preview-lab-1366x768.png) |
| **Full HD Desktop** | $1920 \times 1080$| Standard Lab Desktop | [`docs/screenshots/classroom-preview-desktop-1920x1080.png`](screenshots/classroom-preview-desktop-1920x1080.png) |

All layouts adapt cleanly:
- On desktop/laptop ($1024 \times 768$ and above), two-column grid places Miss Julie on the left and the Smart Board + Voice Beacon on the right.
- On mobile ($390 \times 844$), elements stack in logical visual order (Teacher Stage -> Smart Board -> Voice Beacon -> Demo Controls) with no horizontal scroll.

---

## 4. Test Results

### 4.1 Presentation Components Suite (`client/tests/ui/presentation-components.test.mjs`)
```text
✔ MissJulieTeachingStage reuses MissJulieCharacter without duplicating avatar logic (0.94ms)
✔ VoiceInteractionBeacon strictly enforces deliberate click and avoids auto-activating mic (0.19ms)
✔ SmartLearningBoard guards XP distinction between earned and potential target rewards (0.15ms)
✔ checkClassroomPreviewAccess enforces strict server-verified staff authorization in production (0.16ms)
✔ ClassroomPreviewPage prevents disallowed users from mounting or interacting with sandbox (0.18ms)
✔ Standalone preview HTML is completely removed from public production serving (0.15ms)
✔ Production student navigation routes NEVER link to classroom-preview (0.09ms)

7 passed, 0 failed (283ms)
```

### 4.2 Dedicated Route-Access Suite (`client/tests/ui/classroom-preview-access.test.mjs`)
```text
✔ Access Control: Production anonymous users are strictly blocked and redirected to school login (0.66ms)
✔ Access Control: Authenticated students in production are blocked and redirected to active lesson (0.09ms)
✔ Access Control: Authenticated students in development are ALSO blocked from sandbox (0.07ms)
✔ Access Control: Verified educators (TEACHER and SCHOOL_ADMIN) are authorized in production (0.08ms)
✔ Access Control: Non-student developers are authorized in local development mode (0.08ms)
✔ Access Control: Loading state suspends sandbox rendering without flashing content or early redirects (0.07ms)
✔ Access Control: Unauthorized non-staff role in production is rejected (0.07ms)
✔ Route Protection: Disallowed users never receive sandbox markup or simulation controls (0.27ms)
✔ Asset Protection: Standalone public HTML is completely inaccessible in production (0.22ms)

9 passed, 0 failed (285ms)
```

### 4.3 Browser E2E Test Suite (`client/tests/ui/classroom-preview-browser.test.mjs`)
* Configured for Chromium/Edge headless execution against live environments.
* Verifies `classroom-preview.html` 404/redirect behavior and DOM isolation for anonymous sessions.

### 4.4 Safety Contract Suite (`client/tests/frontend-safety-contract.test.mjs`)
```text
✔ five-digit PIN login is both restricted and submitted without persistent student storage (1.04ms)
✔ frontend resume and progress services use server-authoritative endpoints (0.99ms)
✔ student route guard and canonical lesson registry remain in place (0.29ms)

3 passed, 0 failed (64ms)
```

### 4.5 Production Build Verification (`next build`)
```text
▲ Next.js 16.3.0 (webpack)
✓ Compiled successfully in 3.9s
  Running TypeScript ...
  Finished TypeScript in 2.1s ...
✓ Generating static pages using 15 workers (49/49) in 857ms
Finalizing page optimization ...
Collecting build traces ...
Exit code: 0 (Zero errors across all 49 routes)
```
