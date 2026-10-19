import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l08",
  "grade": 0,
  "level": 8,
  "gradeLabel": "Kindergarten",
  "title": "Feelings and Greetings",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Feelings and Greetings — a distinct music meadow adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to feelings and greetings."
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
    "themeId": "kg-08-feelings-and-greetings",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcd9c2",
      "backgroundDeep": "#e6c591",
      "primary": "#8f4d25",
      "secondary": "#53b853",
      "accent": "#bff536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
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
