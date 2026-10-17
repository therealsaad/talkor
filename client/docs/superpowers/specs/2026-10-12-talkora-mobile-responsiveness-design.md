# Talkora Mobile Responsiveness Design

**Date:** 2026-10-12
**Status:** Draft for user review

## Goal

Make Talkora's existing public, student, lesson, teacher, and school screens comfortable to use on phones and tablets while preserving the current desktop experience.

## Current context

The client already receives Next.js's default `width=device-width` viewport. The responsive gaps therefore come from layout and component styling, not a missing viewport declaration. The app has separate public, student, lesson, and educator shells. Their styles are spread across `globals.css`, `student-v2.css`, `talkora-lesson-v6.css`, `conversation.css`, `educator.css`, and page-specific styles. Several files have overlapping media-query rules, so a single global override would be brittle and could hide overflow without making the underlying content usable.

## Design decision

Improve the layouts in place by screen family. Do not create separate mobile routes or duplicate page components. Keep business logic, API behavior, and desktop information architecture unchanged. Add or adjust styles in the owning shell or page family, and make only small component changes where the current markup prevents a sound mobile layout.

The work covers:

1. Public landing, student login, and teacher/school login.
2. Student portal navigation and student home, dashboard, profile, progress, rewards, class, level/map, and continue screens.
3. Lesson and voice activity screens, including conversation layout, transcript/dialogue, and microphone controls.
4. Teacher and school navigation, dashboards, student/class management, reports, and settings.

## Responsive behavior

- Support narrow phone viewports down to 320 CSS pixels, common phone widths through 430 pixels, and tablet widths through 1024 pixels.
- Prevent page-level horizontal scrolling, clipped text, and actions hidden behind fixed or viewport-height containers. A wide data table may use a clearly bounded horizontal scroller or a stacked card layout when that keeps its values and actions usable.
- Keep primary controls comfortably touchable, with a target area of at least 44 by 44 CSS pixels where practical.
- Reflow navigation and summary bars for narrow screens. Preserve a clear route to every existing navigation item; use the shell's current mobile-menu pattern where available.
- Stack public landing content in a deliberate order and keep the PIN/login card and its controls fully visible without obscuring the character artwork.
- Reflow student lesson scenes so dialogue stays readable and the recording control remains reachable. Let content scroll when it exceeds the device height; do not shrink essential controls or hide them to preserve a fixed desktop composition.
- Respect device safe areas and reduced-motion preferences where fixed or animated UI is involved.
- Retain the current desktop composition at widths where it already fits, and adapt continuously at intermediate widths rather than introducing abrupt clipping.

## Implementation boundaries

- Public/login styling belongs to its existing page styles and shared global primitives.
- Student shell and student pages belong to `student-v2.css` and their route/component styles.
- Lesson/voice layout belongs to the lesson and conversation styles plus only the components needed to make those layouts responsive.
- Teacher/school layout belongs to `educator.css`, `SchoolShell`, and the relevant page styles.
- Avoid blanket `overflow-x: hidden` rules as a substitute for fixing a width or layout constraint.
- Preserve all existing user changes in the shared working tree, especially the landing-page PIN and character positioning work.
- Do not add a UI framework, duplicate mobile pages, or change backend behavior as part of this work.

## Success criteria

- Every screen family listed above can be navigated and used at 320, 360, 390, and 430 pixel phone widths and at 768 and 1024 pixel tablet widths.
- Primary actions, form fields, lesson dialogue, and microphone controls remain visible, legible, and operable at those widths.
- Dense school data remains understandable and its row actions remain reachable on phones.
- No page relies on hidden overflow to conceal important content.
- Existing desktop layouts retain their current structure and visual hierarchy.

## Out of scope

- New product flows or mobile-only feature sets.
- Rebranding or a broad desktop redesign.
- Changes to authentication, curriculum, voice-provider selection, or API contracts.
- Fixing the separate Groq transcription 502; that issue has its own backend design and requires the provider's error log to identify the cause.
