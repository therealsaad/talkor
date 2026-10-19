import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l01",
  "grade": 0,
  "level": 1,
  "gradeLabel": "Kindergarten",
  "title": "ABCD Picture Garden",
  "editorialStatus": "existing-runtime",
  "studentPlayable": false,
  "description": "ABCD Picture Garden — a distinct petal garden adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to abcd picture garden."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-01-abcd-picture-garden",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "big-board",
    "palette": {
      "background": "#fcc2c2",
      "backgroundDeep": "#e6a591",
      "primary": "#8f2525",
      "secondary": "#79b853",
      "accent": "#f5e236",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "bounce",
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
