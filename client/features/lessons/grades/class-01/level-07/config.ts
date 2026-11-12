import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l07",
  "grade": 1,
  "level": 7,
  "gradeLabel": "Class 1",
  "title": "Action Words",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Original voice-first Balbharati activities for chapters 3.1–3.5, with English practice and optional Hindi/Marathi support. Educator sign-off pending.",
  "syllabus": {
    "objectives": [
      "Compare opposites and tell one short original friendship or book story.",
      "Explain one step in Hindi or Marathi when requested; always return to short English speaking.",
      "Use modeled feedback for repeated difficulty and extend only when the student is ready."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": "English Balbharati Standard One (2025; 2026 reprint)",
    "sourcePages": [41, 42, 44, 45, 46],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-07-action-words",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcf5c2",
      "backgroundDeep": "#dce691",
      "primary": "#8f8125",
      "secondary": "#53b884",
      "accent": "#61f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "glow",
    "musicMood": "soft-piano",
    "useReducedMotionFallback": true,
    "minTouchTargetPx": 48
  },
  "learningPolicy": {
    "voiceFirst": true,
    "invisibleAdaptive": true,
    "autoResume": true,
    "introRequired": false,
    "introMustComplete": false,
    "speechLanguage": "en-IN",
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
