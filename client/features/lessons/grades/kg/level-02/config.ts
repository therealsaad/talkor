import type { LevelDesignConfig } from '../../../types'

/** Staff-only E–J preview configuration. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l02",
  "grade": 0,
  "level": 2,
  "gradeLabel": "Kindergarten",
  "title": "Letters E to J",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "A staff-only speaking preview for uppercase letters E, F, G, H, I, and J.",
  "syllabus": {
    "objectives": [
      "Recognize the uppercase letters E, F, G, H, I, and J.",
      "Listen to and say the names of letters E through J."
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
    "themeId": "kg-02-letters-e-to-j",
    "world": "Letter Garden",
    "sceneDescription": "a calm garden with six letter cards",
    "layout": "big-board",
    "palette": {
      "background": "#fcc6c2",
      "backgroundDeep": "#e6aa91",
      "primary": "#8f2b25",
      "secondary": "#73b853",
      "accent": "#f5ec36",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "sway",
    "musicMood": "gentle-marimba",
    "useReducedMotionFallback": true,
    "minTouchTargetPx": 48
  },
  "learningPolicy": {
    "voiceFirst": true,
    "invisibleAdaptive": true,
    "autoResume": true,
    "introRequired": true,
    "introMustComplete": true,
    "speechLanguage": "en-IN",
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
