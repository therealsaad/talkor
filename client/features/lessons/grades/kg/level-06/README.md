# Kindergarten / Level 06 — Family Words

**Code:** `g00-l06` · **Design:** Rainbow Valley · **Status:** draft

- `LevelExperience.tsx` — staff-only visual design prototype. Never directly route students here.
- `config.ts` — grade-specific objectives, theme, animation mood, audio policy, and resume behavior.
- `activities.ts` — real approved activities (empty until authored); ideas do not count as activities.
- `interactions.ts` — available voice/touch/corrective-feedback modes.
- `assets.json` — references to approved media; never add dead placeholder URLs.
- `index.ts` — exports used by the lazy-loaded 110-level registry.

## Authoring workflow

1. Verify the official syllabus and update `config.syllabus` with school-approved outcomes; set `syllabusVerified` only after review.
2. Build real prompts, answer rubrics, and follow-up hints in `activities.ts` using the shared activity engine. Keep activities empty until end-to-end tests exist.
3. Store optimized per-level art/media in `client/public/lessons/kg/level-06/`; register real paths in `assets.json`.
4. Use the existing Azure/Groq/STT backend providers; static clips may use S3, while spontaneous corrections are uncached.
5. Preview via `/school/curriculum-studio/0/6`; test microphone, playback, reduced motion, student resume, and permission boundaries.
6. Publish only using authorized existing DB publication workflow after approval. Do not set `studentPlayable: true` merely to make the preview look complete.

This is an intentionally blank level workspace. The student route must not expose it until approved.
## Approved staff preview

This workspace now contains an approved staff-only preview for the five video-board pairs, in order: A–apple, E–elephant, I–igloo, O–orange, U–umbrella. The approved `vowels.MOV` video is the introduction. The five card PNGs in `client/public/lessons/kg/level-06/cards/` are stills from that video. There are no distractors.

Open School → KG Preview → Level 6. Clicking Level 6 opens fullscreen playback and the fullscreen session continues into Vowel Garden practice. Miss Julie prefers the same pinned Priya v6 voice profile used by Level 1; if its local service is unavailable, speech uses Talkora’s standard Miss Julie Azure voice. Fixed, allowlisted lines cover the introduction, first prompt, replay, correct/incorrect/unclear/silence feedback, microphone/provider errors, and completion. The microphone starts automatically after each prompt; the existing voice-activity detector stops recording after the student finishes. A five-second quiet gap follows each spoken feedback line before the next prompt. There are no student-facing lesson buttons. Answers are checked through the staff-only Level 6 API, and the backend grades against its fixed word mapping, returning only correct/incorrect/unclear/silence; it does not return or save transcripts, recordings, attempts, or progress. Browser speech synthesis is never used; if both Julie voice services are unavailable, the preview displays an error. Provider failures retry automatically a few times; microphone permission failures are explained for the teacher.

Level 6 remains a draft: `studentPlayable` is false and `staffOnlyPreview` is true. Do not publish it or route students to it without the required curriculum review and authorization.
