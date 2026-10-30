# Kindergarten / Level 06 — Vowel Garden

**Code:** `g00-l06` · **Design:** Rainbow Valley · **Status:** staff-only draft preview

The approved staff preview plays `/lessons/kg/level-06/vowels.MOV` full-screen as the introduction. When the video ends, it continues into Vowel Garden and teaches the five video-board pairs in order:

1. A — apple
2. E — elephant
3. I — igloo
4. O — orange
5. U — umbrella

The garden uses a teacher-and-learning-board layout inspired by the Level 4 preview: Miss Julie appears beside the active vowel card, with a progress strip and a speech bubble. The intro video is no longer on screen during this phase, so only one Julie is visible. There are no distractors or lesson-control buttons. Miss Julie speaks each prompt and feedback, pauses five seconds, then listens automatically for the learner. Each card shows its letter and picture with a short label, and the cards advance in order.

Speech requests use the existing staff-only preview authorization and rate limit. Attempt audio and transcripts are processed for the preview response only; this flow does not save student progress, recordings, or transcripts.

This level remains unpublished: `studentPlayable` is `false` and `staffOnlyPreview` is `true`. Do not route students to it or publish it without curriculum review and authorization.
