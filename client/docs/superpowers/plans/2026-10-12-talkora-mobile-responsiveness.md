# Talkora Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Work inline in the current workspace; do not delegate tasks.

**Goal:** Make Talkora's public, student, lesson, teacher, and school screens usable on phones and tablets while preserving the existing desktop experience.

**Architecture:** Improve the current layouts by screen family. Reuse each page's existing shell, routes, and components; make localized CSS changes first and adjust markup only when it blocks a usable mobile layout. Keep backend behavior, voice-provider selection, and desktop information architecture unchanged.

**Tech Stack:** Next.js App Router 16.3, React, TypeScript, global CSS, existing page and shell components.

**Spec:** `docs/superpowers/specs/2026-10-12-talkora-mobile-responsiveness-design.md`

## Global Constraints

- Support phone widths from 320 through 430 CSS pixels and tablet widths through 1024 CSS pixels.
- Prevent page-level horizontal scrolling and clipped content; bounded table scrollers are allowed when row values and actions remain usable.
- Keep primary touch targets at least 44 by 44 CSS pixels where practical.
- Preserve existing routes, behavior, desktop hierarchy, and user edits.
- Avoid blanket overflow clipping, duplicated mobile routes, UI frameworks, and backend/API changes.
- Treat the current dirty working tree as user-owned; do not reset, revert, or stage unrelated files.

## Review Focus

- At 320 pixels, headings, PIN inputs, form buttons, and navigation must fit without clipping.
- On short phone viewports, fixed-height lesson layouts must not hide dialogue or the microphone control.
- School tables must keep important values and row actions reachable without widening the whole page.
- Safe-area insets and the bottom navigation must not cover content or microphone controls.
- Desktop layouts at widths where they currently fit must retain their structure and visual hierarchy.

---

### Task 1: Public landing and login screens

**Files:**
- Modify: `app/talkora-home.css`
- Modify: `app/student/talkora-home.css`
- Modify: `app/login/student/student-login.css`
- Modify: `app/page.tsx` only if current markup prevents the responsive layout
- Modify: `app/login/student/page.tsx`, `app/login/teacher/page.tsx`, or `app/login/school/page.tsx` only if their markup prevents responsive styling

**Interfaces:**
- Consumes: existing landing and login components, PIN flow, existing routes
- Produces: the same public and login flows reflowed for phone and tablet widths

- [x] Inspect the current working diffs and identify the selectors that own each public/login layout. Preserve the approved PIN autofocus, PIN card sizing, and character positioning.
- [x] Adjust the existing page-family styles so the public hero, characters, PIN card, navigation, login forms, and secondary actions stack or wrap without overlapping or clipping from 320 through 1024 pixels.
- [x] Keep the student PIN field and submit action visible and comfortably touchable on narrow screens; keep the girl character artwork and other illustration elements from sitting under the login card.

**Reviewable result:** public landing and all login entry screens use their existing markup and remain readable and operable across the supported widths.

### Task 2: Student portal shell and non-lesson pages

**Files:**
- Modify: `app/student-v2.css`
- Modify: `components/student/shell/student-portal-shell.tsx` only if shared layout markup prevents reflow
- Modify: `components/student/navigation/student-nav.tsx` only if mobile navigation needs markup support
- Modify only the route components that have page-specific fixed widths or grids: `app/student/home/page.tsx`, `app/student/dashboard/page.tsx`, `app/student/profile/page.tsx`, `app/student/progress/page.tsx`, `app/student/rewards/page.tsx`, `app/student/classes/page.tsx`, `app/student/level/page.tsx`, `app/student/levels/page.tsx`, `app/student/levels/[id]/page.tsx`, `app/student/continue/page.tsx`, `app/student/practice/page.tsx`, `app/student/practice/home/page.tsx`, and `app/student/practice/talk/page.tsx`

**Interfaces:**
- Consumes: `StudentPortalShell`, `StudentNav`, existing student route content
- Produces: shared student navigation and page content that reflow without hiding route choices or card actions

- [x] Review shell, top HUD, navigation, and route-level grids together; identify fixed widths and desktop-only assumptions before editing.
- [x] Adjust the student shell and navigation for narrow widths, preserving access to every existing destination and keeping the profile and progress indicators visible.
- [x] Reflow page-specific cards, level maps, lists, and action groups; use bounded scrolling only for content that cannot be meaningfully stacked.

**Reviewable result:** student home, dashboard, profile, progress, rewards, classes, levels, continue, and practice pages fit phone and tablet layouts without changing their learning behavior.

### Task 3: Lesson and voice activity screens

**Files:**
- Modify: `app/talkora-lesson-v6.css`
- Modify: `app/conversation.css`
- Modify: lesson-specific sections in `app/student-v2.css`
- Modify only where needed: `components/lessons/activity-engine.tsx`, `components/lessons/conversation-engine.tsx`, `components/student/lesson/conversation-stage.tsx`, `components/student/lesson/microphone-control.tsx`, and `components/student/lesson/immersive-lesson-stage.tsx`

**Interfaces:**
- Consumes: existing activity and conversation flows, recording state, student lesson shell
- Produces: the same lesson and voice interactions with readable dialogue and reachable controls on small screens

- [x] Trace the active lesson markup and the final CSS cascade so edits land in the selectors used by the current student lesson route.
- [x] Reflow lesson scenes and dialogue for phone widths; allow vertical scrolling when the content is taller than the viewport rather than clipping it in a fixed-height stage.
- [x] Keep recording, replay, answer, and continue controls reachable and large enough to tap; account for safe-area space when controls sit near the bottom edge.
- [x] Preserve the existing activity sequence, voice request behavior, and current user edits in lesson components.

**Reviewable result:** student lesson, conversation, and microphone flows retain their behavior while fitting phone and tablet viewports.

### Task 4: Teacher and school portal screens

**Files:**
- Modify: `app/educator.css`
- Modify: `components/school/school-shell.tsx` only if the existing mobile menu or header needs markup support
- Modify only where needed: `app/school/dashboard/page.tsx`, `app/school/students/page.tsx`, `app/school/students/student-management-page.tsx`, `app/school/students/[id]/page.tsx`, `app/school/students/new/page.tsx`, `app/school/students/[id]/edit/page.tsx`, `app/school/classes/page.tsx`, `app/school/classes/[id]/page.tsx`, `app/school/teachers/page.tsx`, `app/school/reports/page.tsx`, and `app/school/settings/page.tsx`

**Interfaces:**
- Consumes: `SchoolShell`, existing teacher/admin routes, data tables, forms, and report summaries
- Produces: the same staff tasks available within a phone-friendly navigation and content layout

- [x] Review the current sidebar/menu behavior and page-level inline layout styles; preserve the existing role-specific navigation.
- [x] Reflow dashboard cards, report summaries, forms, and page headers for narrow widths.
- [x] Keep dense student and class data usable with a bounded table scroller or stacked row cards, ensuring row actions remain reachable and the page itself does not widen.

**Reviewable result:** teacher and school users can reach existing navigation items, forms, data, and actions on phone and tablet widths.

## Execution notes

- Implement one screen family at a time and keep each change focused on its owning styles or markup.
- Do not run tests or add test files under the current task instruction.
- After this plan is reviewed, use the inline `superpowers:executing-plans` workflow; no agent delegation is planned.
