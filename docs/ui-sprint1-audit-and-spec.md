# Talkora — Sprint 1: Student UI/UX Audit & Visual Classroom Design Specification

**Role:** Lead Product Designer, Senior Frontend Engineer, Motion Designer & Child-Centered UX Specialist  
**Audience:** ChatGPT (Chief Architect & PM), Codex (Backend & AI Teaching Engine), Z.ai (Curriculum), Copilot (Frontend QA)  
**Date:** October 31, 2026  
**Status:** Sprint 1 Discovery & Visual Architecture (Approved for Team Review)

---

## Executive Summary

Talkora is transforming English language acquisition for students across Maharashtra, spanning **Kindergarten through Class 10** based on the State Board Balbharati curriculum. Our primary target environment is the **school computer lab**, where young children (ages 4–16) share computers, use varied input devices (mice, trackpads, keyboards, headsets), and learn in noisy, high-energy settings.

To achieve our mission, the student experience must adhere strictly to:
$$\text{Voice First} \longrightarrow \text{Visual Second} \longrightarrow \text{Text Third}$$

This document presents a comprehensive audit of the existing Talkora frontend codebase (`client/`), inventories approved Miss Julie character and environment assets, diagnoses critical UX bottlenecks for young learners, and establishes an extensible, high-performance visual design specification for the **Miss Julie Teaching Stage**, **Smart Learning Board**, and **Voice Interaction Beacon**.

---

## 1. Repository & Architecture Audit

### 1.1 Git & Branch Verification
* **Isolated Worktree:** `D:\talkor\talkor-ui`
* **Isolated Branch:** `feature/ai-student-ui` (based on latest `origin/main` at `424894a`)
* **Preservation Policy:** Main shared checkout `D:\talkor\talkor` is completely untouched. No uncommitted work or untracked scripts modified or deleted.

### 1.2 Tech Stack
* **Framework:** Next.js 16.3.0 (App Router), React 19, TypeScript 5.7.3
* **Styling:** Tailwind CSS v4, custom modular CSS architectures, Tw-Animate-CSS
* **Animation:** Framer Motion 13.1.1, GSAP 3.15, hardware-accelerated CSS animations with strict `prefers-reduced-motion` compliance
* **Icons:** Lucide React
* **Speech & Audio:** Azure Speech Services (Dynamic synthesis & STT), Sarvam STT (bilingual English/Hindi/Marathi recognition), Web Audio API (`AudioContext`), S3-cached static curriculum narration
* **Authentication:** Lab-friendly 5-digit PIN authentication with temporary `sessionStorage` (preventing persistent session bleed across shared lab periods)

---

## 2. Comprehensive UI Findings & Page Inspection

### 2.1 Inspected Routes & User Flows

1. **Student Login (`/login/student` & `/student-login`)**:
   - **Design:** Dedicated school lab login. Features high-contrast 5-digit PIN input with a large virtual number keypad (`1–9, 0, clear, delete`).
   - **Strengths:** No student rosters or sensitive PII displayed on shared screens; keypad allows touch or mouse-only entry for young learners without keyboard familiarity.
   - **Findings:** Distraction-free, responsive, redirects cleanly via `AuthProvider` to `/student/continue`.

2. **Student Routing Hub (`/student/continue`)**:
   - **Design:** Single grade-authoritative resolver.
   - **Logic:** KG students (`student.grade === 0`) route directly to `/student/kg`. Class 1+ queries `curriculumService.getNextLesson()` and redirects to `/student/lesson/[id]`, or `/student/home` if all published units are complete.
   - **Security:** Never relies on client-provided query parameters or local storage to choose curriculum grade.

3. **Student Adventure Home (`/student/home`)**:
   - **Design:** `talkora-home-dashboard`. Shows current unit progress, continue CTA button, personalized memory greetings (favorite sport, favorite food), Miss Julie voice greeting, and daily activity metrics.
   - **Findings:** Visually rich; KG/Class 1 learners rarely see this because `/student/continue` sends them directly to active learning.

4. **KG Level 1 Alphabet Garden (`/student/kg` & `/student/kg/map`)**:
   - **Design:** Dedicated nature/garden theme (`kg-alpha`). Features 8 canonical steps:
     - 4 Spoken Letter steps: Say A, Say B, Say C, Say D (listening for phonemes).
     - 4 Interactive Touch steps: Find A (Apple vs Ball), Find B, Find C, Find D.
   - **Mandatory Intro:** Enforces `/lessons/kg/videos/fullkg.mp4` intro video with server ticket issuance.
   - **Findings:** Excellent child-friendly touch targets. Miss Julie rendered via `AnimatedMissJulie` with transparent `.webm` video.

5. **Class 1 Level 1 Balbharati 1.1 Classroom (`/student/lesson/[id]`)**:
   - **Design:** Mounts `Class1Immersion` with two specialized engines:
     - `FirstDayClassroom`: 10-step oral adventure exploring "My First Day at School" (skip, run, walk, smile, bell, jump, play, enter class, grade one). Features SVG school illustration, animated character icons, and bilingual Marathi/Hindi meanings.
     - `FirstDayPoemClassroom`: Authentic Balbharati 1.1 poem recitation ("See me skip, See me run..."). Broken into 5 two-line stanzas followed by a full 10-line recitation challenge with an opt-in gentle musical pulse.
   - **Findings:** Educationally grounded in textbook material; high fidelity to Balbharati standards.

6. **General Classroom (`ImmersiveLessonStage`)**:
   - **Design:** 2-column layout with Miss Julie on the left (`tk-julie`) and interactive activity cards on the right (`tk-learning-stack`).
   - **Supports:** Like/Dislike warm-ups, picture choice quiz, spelling tile assembly, listen-and-repeat, model story conversations, and open AI conversations.

---

## 3. Miss Julie Character & Media Asset Inventory

Miss Julie is the heart of Talkora. She is an approved, warm, 3D semi-realistic animated teacher with wavy brown hair, warm brown eyes, pearl earrings, a light blue blazer, white blouse, and beige trousers.

### Approved Poses & Video Assets (`/public/miss-julie/` & `/public/miss-julie-animations/`)
* **High-Resolution WebP Poses:** `welcome.webp`, `standing.webp`, `teaching.webp`, `modeling.webp`, `listening.webp`, `thinking.webp`, `speaking.webp`, `encouraging.webp`, `heart.webp`, `try_again.webp`, `proud.webp`, `celebrating.webp`, `pointing.webp`, `reading.webp`.
* **Transparent Video Loops (`.webm`):** `idle.webm` (251 KB), `speaking.webm` (248 KB), `listening.webm` (320 KB), `thinking.webm` (223 KB), `pointing.webm` (213 KB), `encouraging.webm` (166 KB), `celebrating.webm` (504 KB).

---

## 4. UI Problems Materially Affecting Learning

1. **Text Reliance in Early Childhood Lessons:** In several existing activities, instructions are displayed as dense text paragraphs. Six-year-old Grade 1 students in Maharashtra cannot read complex English instructions. The learning board must communicate the prompt visually through illustrations, iconography, and voice cues.
2. **The "Chatbot Stigma":** Alternating "You" / "Teacher" bubbles look like a messaging app rather than a teacher guiding a classroom.
3. **Fragmented Classroom Framing Across Grades:** The lack of a coherent Talkora Classroom Stage confuses students who advance from KG to Class 1.
4. **Unclear Turn-Taking in Noisy Labs:** In noisy lab environments with 30 children, visual cues must clearly signal whose turn it is: when Miss Julie is speaking, when she is expecting the child to speak, and when she is processing the child's voice.

---

## 5. Isolated Presentation Components Delivered (Sprint 1)

1. **`MissJulieTeachingStage` (`client/components/student/lesson/miss-julie-teaching-stage.tsx`):**
   - Pure presentation component encapsulating Miss Julie's approved character poses, transparent video loops, dynamic state aura, and teacher utterance speech card.
   - Reuses `MissJulieCharacter` directly without duplicating character or animation code.
   - Does NOT touch or trigger the microphone.

2. **`VoiceInteractionBeacon` (`client/components/student/lesson/voice-interaction-beacon.tsx`):**
   - High-visibility visual state indicator reflecting actual runtime states: teacher speaking, recording, processing, ready, and error.
   - Strictly enforces deliberate student clicks (`onStartMic` / `onStopMic`). Does NOT auto-trigger the microphone.
   - Button is disabled while teacher is speaking or processing.

3. **`SmartLearningBoard` (`client/components/student/lesson/smart-learning-board.tsx`):**
   - Modular visual learning board with sample datasets for:
     - Phonics (Letter sound discovery)
     - Vocabulary (Balbharati 1.1 action word "skip" with bilingual Marathi/Hindi bridges)
     - Storybook ("My First Day" school adventure)
     - Choices (Child-friendly touch tiles)
   - Operates purely as a visual presentation layer without modifying production lesson orchestration.

4. **Interactive Showcase (`client/app/classroom-preview/page.tsx` & `client/public/classroom-preview.html`):**
   - Live in-app review route (`/classroom-preview`) allowing interactive testing of all teacher poses, beacon states, and board modes.
