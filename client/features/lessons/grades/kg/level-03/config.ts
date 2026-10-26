import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l03",
  "grade": 0,
  "level": 3,
  "gradeLabel": "Kindergarten",
  "title": "Letters K to P",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "A staff-only draft preview introducing uppercase letters K, L, M, N, O, and P.",
  "syllabus": {
    "objectives": [
      "Recognize the uppercase letters K, L, M, N, O, and P.",
      "Listen to and say the names of letters K through P."
    ],
    "skills": [
      "listening",
      "speaking",
      "letter-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-03-letters-k-p",
    "world": "Coral Lagoon",
    "sceneDescription": "a calm coral lagoon with bubbles and six letter cards",
    "layout": "big-board",
    "palette": {
      "background": "#fcc9c2",
      "backgroundDeep": "#e6ae91",
      "primary": "#8f3125",
      "secondary": "#6eb853",
      "accent": "#f3f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "sway",
    "musicMood": "ambient-bells",
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
