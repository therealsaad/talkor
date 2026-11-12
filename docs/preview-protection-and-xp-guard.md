# Talkora — Issue #67: Preview Protection, Simulation Distinction & XP Guard

**Author:** Antigravity (Lead Product Designer & Senior Frontend Engineer)  
**Date:** October 31, 2026  
**Reference:** [Issue #67](https://github.com/therealsaad/talkor/issues/67)  
**Branch:** `feature/issue-67-preview-guard`  
**Status:** Ready for Project Manager Review  

---

## 1. Objectives & Scope

In accordance with Project Manager instructions for Issue #67:
1. **Protect the classroom preview from production student flows:** Ensure students cannot mistake the isolated sandbox for an accredited lesson, and prevent accidental student entry from official navigation.
2. **Distinguish simulated actions from actual learning:** Clearly label all interactive preview controls, beacon state toggles, and feedback responses as simulated demos.
3. **Ensure XP is only displayed as earned when confirmed by the real backend:** Prevent misleading `+XP` claims on the board or in preview feedback before backend attempt verification.
4. **Preserve production lesson orchestration:** Do NOT integrate the teaching UI into `LessonExperience` or `ImmersiveLessonStage` yet. Keep existing KG/Class 1 logic 100% intact.

---

## 2. Implemented Safeguards

### 2.1 Protection from Production Student Flows
* **Staff & Developer Sandbox Banner:** Added a persistent top banner to `ClassroomPreviewPage` and `classroom-preview.html` with shield icon:
  > **STAFF & DEVELOPER SANDBOX · NOT AN ACCREDITED LESSON**  
  > *Simulated presentation demo. No student voice recordings, attempts, or XP are saved to the database.*
* **Authenticated Student Guard Notice:** If an authenticated student navigates to `/classroom-preview`, an alert appears:
  > **You are signed in as a student!**  
  > *This sandbox does not count toward your class lessons or stars. Click below to resume your real lesson: [Resume My Lesson -> /student/continue]*
* **Zero Production Links:** Confirmed that `student-nav.tsx`, `student/continue/page.tsx`, `student/home/page.tsx`, and lesson registries do not link to `/classroom-preview`.

### 2.2 Distinguishing Simulated Actions
* **Teacher Pose Simulator:** Header updated to `Teacher Pose Simulator (UI Demo Only)` with explanatory note: *Tests visual state transitions without making real AI calls.*
* **Voice Beacon Simulator:** Labeled as `Beacon Simulator (Demo Only · No Audio Stream)`. Action buttons renamed to `Simulate Teacher Speaks`, `Simulate Teacher Stops`, `Simulate Error (Demo)`.
* **Simulated Feedback Banner:** Replaced ambiguous praise with explicit demo disclaimer:
  * Title: `Demo Teacher Feedback:`
  * Disclaimer: `Real XP is recorded only after verified backend attempts in official lessons.`
  * Badge: `Simulated Demo (0 XP Awarded)` (instead of claiming `+10 XP`).

### 2.3 Strict XP Display Guard
* **`SmartLearningBoard` (`smart-learning-board.tsx`):**
  * Added `confirmedXp?: number`: Only renders `+{confirmedXp} XP (Earned)` when confirmed by server progress updates.
  * Added `potentialXp?: number`: Renders `Goal: {potentialXp} XP` with a muted trophy icon and no plus sign, indicating future potential rather than earned XP.
  * In `ClassroomPreviewPage`, passed `potentialXp={15}` so the board displays `Goal: 15 XP (Demo)`, never falsely claiming that XP has been earned.

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

### Targeted Presentation & Safety Tests (`tests/ui/presentation-components.test.mjs`)
```text
✔ MissJulieTeachingStage reuses MissJulieCharacter without duplicating avatar logic (1.51ms)
✔ VoiceInteractionBeacon strictly enforces deliberate click and avoids auto-activating mic (0.54ms)
✔ SmartLearningBoard guards XP and only renders +XP when confirmed by backend (0.34ms)
✔ ClassroomPreviewPage protects student flows and clearly labels simulated actions (0.45ms)
✔ Production student navigation routes NEVER link to classroom-preview (0.54ms)

5 tests passed, 0 failed.
```

### Safety Contract Tests (`tests/frontend-safety-contract.test.mjs`)
```text
✔ five-digit PIN login is both restricted and submitted without persistent student storage (3.31ms)
✔ frontend resume and progress services use server-authoritative endpoints (2.21ms)
✔ student route guard and canonical lesson registry remain in place (0.92ms)

3 tests passed, 0 failed.
```

### TypeScript Verification
```text
npx tsc --noEmit
Exit code: 0 (Zero errors)
```
